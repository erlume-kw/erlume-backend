import { Request, Response } from "express";
import mongoose from "mongoose";
import Sale from "../models/Sale";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Transaction from "../models/Transaction";
import { getMonthYearDateRange } from "../utils/dateRange";

const getSales = async (req: Request, res: Response): Promise<void> => {
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

		const sales = await Sale.find(filter)
			.populate("order_id")
			.populate("order_item_id")
			.populate("transaction_id")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			data: sales,
			count: sales.length,
		});
	} catch (error) {
		console.error("Error in getSales:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getSalesByOrderId = async (
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

		const sales = await Sale.find(filter)
			.populate("order_id")
			.populate("order_item_id")
			.populate("transaction_id")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			data: sales,
			count: sales.length,
		});
	} catch (error) {
		console.error("Error in getSalesByOrderId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getSaleById = async (req: Request, res: Response): Promise<void> => {
	try {
		const saleId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(saleId)) {
			res.status(400).json({ success: false, error: "Invalid sale ID" });
			return;
		}

		const sale = await Sale.findById(saleId)
			.populate("order_id")
			.populate("order_item_id")
			.populate("transaction_id");

		if (!sale) {
			res.status(404).json({ success: false, error: "Sale not found" });
			return;
		}

		res.status(200).json({ success: true, data: sale });
	} catch (error) {
		console.error("Error in getSaleById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createSale = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			order_id,
			order_item_id,
			transaction_id,
			invoice_number,
			invoice_url,
			payment_evidence_url,
		} = req.body;

		if (!order_id || !order_item_id) {
			res.status(400).json({
				success: false,
				error: "Missing required fields: order_id, order_item_id",
			});
			return;
		}

		if (!mongoose.Types.ObjectId.isValid(order_id)) {
			res.status(400).json({ success: false, error: "Invalid order_id" });
			return;
		}

		if (!mongoose.Types.ObjectId.isValid(order_item_id)) {
			res.status(400).json({ success: false, error: "Invalid order_item_id" });
			return;
		}

		const [order, orderItem] = await Promise.all([
			Order.findById(order_id),
			OrderItem.findById(order_item_id),
		]);

		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		if (!orderItem) {
			res.status(404).json({ success: false, error: "Order item not found" });
			return;
		}

		if (transaction_id) {
			if (!mongoose.Types.ObjectId.isValid(transaction_id)) {
				res.status(400).json({
					success: false,
					error: "Invalid transaction_id",
				});
				return;
			}

			const transaction = await Transaction.findById(transaction_id);
			if (!transaction) {
				res.status(404).json({
					success: false,
					error: "Transaction not found",
				});
				return;
			}
		}

		const newSale = new Sale({
			order_id,
			order_item_id,
			transaction_id: transaction_id || undefined,
			invoice_number,
			invoice_url,
			payment_evidence_url,
		});

		const savedSale = await newSale.save();

		res.status(201).json({
			success: true,
			message: "Sale created successfully",
			data: savedSale,
		});
	} catch (error: any) {
		console.error("Error in createSale:", error);

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

const updateSale = async (req: Request, res: Response): Promise<void> => {
	try {
		const saleId = req.params.id;
		const { transaction_id, invoice_number, invoice_url, payment_evidence_url } =
			req.body;

		if (!mongoose.Types.ObjectId.isValid(saleId)) {
			res.status(400).json({ success: false, error: "Invalid sale ID" });
			return;
		}

		const sale = await Sale.findById(saleId);
		if (!sale) {
			res.status(404).json({ success: false, error: "Sale not found" });
			return;
		}

		const update: Record<string, unknown> = {};

		if (transaction_id !== undefined) {
			if (transaction_id === null || transaction_id === "") {
				update.transaction_id = null;
			} else {
				if (!mongoose.Types.ObjectId.isValid(transaction_id)) {
					res.status(400).json({
						success: false,
						error: "Invalid transaction_id",
					});
					return;
				}

				const transaction = await Transaction.findById(transaction_id);
				if (!transaction) {
					res.status(404).json({
						success: false,
						error: "Transaction not found",
					});
					return;
				}
				update.transaction_id = transaction_id;
			}
		}

		if (invoice_number !== undefined) {
			update.invoice_number = invoice_number;
		}

		if (invoice_url !== undefined) {
			update.invoice_url = invoice_url;
		}

		if (payment_evidence_url !== undefined) {
			update.payment_evidence_url = payment_evidence_url;
		}

		const updatedSale = await Sale.findByIdAndUpdate(
			saleId,
			{ $set: update },
			{ new: true, runValidators: true },
		)
			.populate("order_id")
			.populate("order_item_id")
			.populate("transaction_id");

		res.status(200).json({
			success: true,
			message: "Sale updated successfully",
			data: updatedSale,
		});
	} catch (error: any) {
		console.error("Error in updateSale:", error);

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

const deleteSale = async (req: Request, res: Response): Promise<void> => {
	try {
		const saleId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(saleId)) {
			res.status(400).json({ success: false, error: "Invalid sale ID" });
			return;
		}

		const sale = await Sale.findById(saleId);
		if (!sale) {
			res.status(404).json({ success: false, error: "Sale not found" });
			return;
		}

		await Sale.findByIdAndDelete(saleId);

		res.status(200).json({
			success: true,
			message: "Sale deleted successfully",
			data: { id: saleId },
		});
	} catch (error) {
		console.error("Error in deleteSale:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getSales,
	getSalesByOrderId,
	getSaleById,
	createSale,
	updateSale,
	deleteSale,
};
