import { Request, Response } from "express";
import Transaction from "../models/Transaction";
import Order from "../models/Order";
import DiscountCode from "../models/DiscountCode";
import mongoose from "mongoose";
import { TransactionStatus } from "../enums/transactionEnums";
import { PaymentMethod } from "../enums/paymentEnums";
import { getMonthYearDateRange } from "../utils/dateRange";

const getTransactions = async (req: Request, res: Response): Promise<void> => {
	try {
		const { year, month } = req.query;
		const filter: Record<string, unknown> = {};
		const { range, error } = getMonthYearDateRange(year, month);
		if (error) {
			res.status(400).json({ success: false, error });
			return;
		}
		if (range) {
			filter.createdAt = range;
		}

		const transactions = await Transaction.find(filter)
			.populate("order_id")
			.populate("discount_id");
		res.status(200).json({
			success: true,
			data: transactions,
			count: transactions.length,
		});
	} catch (error) {
		console.error("Error in getTransactions:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getTransactionsByOrderId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const orderId = req.params.orderId;
		const { year, month } = req.query;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			res.status(400).json({ success: false, error: "Invalid order ID" });
			return;
		}

		const order = await Order.findById(orderId);
		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		const filter: Record<string, unknown> = { order_id: orderId };
		const { range, error } = getMonthYearDateRange(year, month);
		if (error) {
			res.status(400).json({ success: false, error });
			return;
		}
		if (range) {
			filter.createdAt = range;
		}

		const transactions = await Transaction.find(filter)
			.populate("order_id")
			.populate("discount_id");

		res.status(200).json({
			success: true,
			data: transactions,
			count: transactions.length,
		});
	} catch (error) {
		console.error("Error in getTransactionsByOrderId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getTransactionById = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const transactionId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(transactionId)) {
			res.status(400).json({ success: false, error: "Invalid transaction ID" });
			return;
		}

		const transaction = await Transaction.findById(transactionId)
			.populate("order_id")
			.populate("discount_id");

		if (!transaction) {
			res.status(404).json({ success: false, error: "Transaction not found" });
			return;
		}

		res.status(200).json({ success: true, data: transaction });
	} catch (error) {
		console.error("Error in getTransactionById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

	const createTransaction = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { order_id, discount_rate, amount, discount_id, paymentMethod } =
			req.body;

		// Validate required fields
		if (!order_id || !discount_rate || !amount) {
			res.status(400).json({
				success: false,
				error: "Missing required fields: order_id, discount_rate, amount",
			});
			return;
		}

		// Validate order_id
		if (!mongoose.Types.ObjectId.isValid(order_id)) {
			res.status(400).json({ success: false, error: "Invalid order_id" });
			return;
		}

		const order = await Order.findById(order_id);
		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		// Check if transaction already exists for this order
		const existingTransaction = await Transaction.findOne({ order_id });
		if (existingTransaction) {
			// Return success with existing transaction instead of error
			res.status(200).json({
				success: true,
				message: "Transaction already exists for this order",
				data: existingTransaction,
			});
			return;
		}

		// Validate discount_id if provided
		if (discount_id) {
			if (!mongoose.Types.ObjectId.isValid(discount_id)) {
				res.status(400).json({ success: false, error: "Invalid discount_id" });
				return;
			}

			const discount = await DiscountCode.findById(discount_id);
			if (!discount) {
				res.status(404).json({
					success: false,
					error: "Discount code not found",
				});
				return;
			}
		}

		// Validate paymentMethod if provided
		if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod)) {
			res.status(400).json({
				success: false,
				error: `Invalid paymentMethod. Must be one of: ${Object.values(
					PaymentMethod,
				).join(", ")}`,
			});
			return;
		}

		// Create transaction
		const newTransaction = new Transaction({
			order_id,
			discount_rate,
			amount,
			discount_id,
			status: TransactionStatus.Pending, // Default status
			paymentMethod: paymentMethod || undefined, // Optional payment method
		});

		const savedTransaction = await newTransaction.save();

		res.status(201).json({
			success: true,
			message: "Transaction created successfully",
			data: savedTransaction,
		});
	} catch (error: any) {
		console.error("Error in createTransaction:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const updateTransaction = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const transactionId = req.params.id;
		const { discount_rate, amount, discount_id, status, paymentMethod } =
			req.body;

		if (!mongoose.Types.ObjectId.isValid(transactionId)) {
			res.status(400).json({ success: false, error: "Invalid transaction ID" });
			return;
		}

		const transaction = await Transaction.findById(transactionId);
		if (!transaction) {
			res.status(404).json({ success: false, error: "Transaction not found" });
			return;
		}

		// Build update object - only update fields that are provided
		const update: any = {};

		if (discount_rate !== undefined) {
			update.discount_rate = discount_rate;
		}

		if (amount !== undefined) {
			update.amount = amount;
		}

		if (discount_id !== undefined) {
			if (discount_id === null || discount_id === "") {
				// Allow clearing the discount_id
				update.discount_id = null;
			} else {
				if (!mongoose.Types.ObjectId.isValid(discount_id)) {
					res.status(400).json({
						success: false,
						error: "Invalid discount_id",
					});
					return;
				}

				const discount = await DiscountCode.findById(discount_id);
				if (!discount) {
					res.status(404).json({
						success: false,
						error: "Discount code not found",
					});
					return;
				}
				update.discount_id = discount_id;
			}
		}

		if (status !== undefined) {
			if (!Object.values(TransactionStatus).includes(status)) {
				res.status(400).json({
					success: false,
					error: `Invalid status. Must be one of: ${Object.values(
						TransactionStatus,
					).join(", ")}`,
				});
				return;
			}
			update.status = status;
		}

		if (paymentMethod !== undefined) {
			if (paymentMethod === null || paymentMethod === "") {
				// Allow clearing the paymentMethod
				update.paymentMethod = null;
			} else {
				if (!Object.values(PaymentMethod).includes(paymentMethod)) {
					res.status(400).json({
						success: false,
						error: `Invalid paymentMethod. Must be one of: ${Object.values(
							PaymentMethod,
						).join(", ")}`,
					});
					return;
				}
				update.paymentMethod = paymentMethod;
			}
		}

		// Update transaction
		const updatedTransaction = await Transaction.findByIdAndUpdate(
			transactionId,
			{ $set: update },
			{ new: true, runValidators: true },
		)
			.populate("order_id")
			.populate("discount_id");

		res.status(200).json({
			success: true,
			message: "Transaction updated successfully",
			data: updatedTransaction,
		});
	} catch (error: any) {
		console.error("Error in updateTransaction:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const updateTransactionStatus = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const transactionId = req.params.id;
		const { status } = req.body;

		if (!mongoose.Types.ObjectId.isValid(transactionId)) {
			res.status(400).json({ success: false, error: "Invalid transaction ID" });
			return;
		}

		if (!status) {
			res.status(400).json({
				success: false,
				error: "Missing required field: status",
			});
			return;
		}

		if (!Object.values(TransactionStatus).includes(status)) {
			res.status(400).json({
				success: false,
				error: `Invalid status. Must be one of: ${Object.values(
					TransactionStatus,
				).join(", ")}`,
			});
			return;
		}

		const transaction = await Transaction.findById(transactionId);
		if (!transaction) {
			res.status(404).json({ success: false, error: "Transaction not found" });
			return;
		}

		const updatedTransaction = await Transaction.findByIdAndUpdate(
			transactionId,
			{ status },
			{ new: true, runValidators: true },
		)
			.populate("order_id")
			.populate("discount_id");

		res.status(200).json({
			success: true,
			message: "Transaction status updated successfully",
			data: updatedTransaction,
		});
	} catch (error: any) {
		console.error("Error in updateTransactionStatus:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const deleteTransaction = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const transactionId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(transactionId)) {
			res.status(400).json({ success: false, error: "Invalid transaction ID" });
			return;
		}

		const transaction = await Transaction.findById(transactionId);
		if (!transaction) {
			res.status(404).json({ success: false, error: "Transaction not found" });
			return;
		}

		await Transaction.findByIdAndDelete(transactionId);

		res.status(200).json({
			success: true,
			message: "Transaction deleted successfully",
			data: { id: transactionId },
		});
	} catch (error) {
		console.error("Error in deleteTransaction:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getTransactions,
	getTransactionsByOrderId,
	getTransactionById,
	createTransaction,
	updateTransaction,
	updateTransactionStatus,
	deleteTransaction,
};
