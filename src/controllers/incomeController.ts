import { Request, Response } from "express";
import mongoose from "mongoose";
import Income from "../models/Income";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Item from "../models/Item";
import User from "../models/User";
import { getMonthYearDateRange } from "../utils/dateRange";

const getIncomes = async (req: Request, res: Response): Promise<void> => {
	try {
		const { orderId, itemId, sellerId, year, month } = req.query;
		const filter: Record<string, unknown> = {};
		const { range, error } = getMonthYearDateRange(year, month);
		if (error) {
			res.status(400).json({ success: false, error });
			return;
		}
		if (range) {
			filter.received_at = range;
		}

		if (orderId) {
			if (!mongoose.Types.ObjectId.isValid(orderId as string)) {
				res.status(400).json({ success: false, error: "Invalid orderId" });
				return;
			}
			filter.order_id = orderId;
		}

		if (itemId) {
			if (!mongoose.Types.ObjectId.isValid(itemId as string)) {
				res.status(400).json({ success: false, error: "Invalid itemId" });
				return;
			}
			filter.item_id = itemId;
		}

		if (sellerId) {
			if (!mongoose.Types.ObjectId.isValid(sellerId as string)) {
				res.status(400).json({ success: false, error: "Invalid sellerId" });
				return;
			}
			filter.seller_id = sellerId;
		}

		const incomes = await Income.find(filter)
			.populate("order_id")
			.populate("order_item_id")
			.populate("item_id")
			.populate("seller_id")
			.sort({ received_at: -1 });

		res.status(200).json({
			success: true,
			data: incomes,
			count: incomes.length,
		});
	} catch (error) {
		console.error("Error in getIncomes:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getIncomeById = async (req: Request, res: Response): Promise<void> => {
	try {
		const incomeId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(incomeId)) {
			res.status(400).json({ success: false, error: "Invalid income ID" });
			return;
		}

		const income = await Income.findById(incomeId)
			.populate("order_id")
			.populate("order_item_id")
			.populate("item_id")
			.populate("seller_id");

		if (!income) {
			res.status(404).json({ success: false, error: "Income not found" });
			return;
		}

		res.status(200).json({ success: true, data: income });
	} catch (error) {
		console.error("Error in getIncomeById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createIncome = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			order_id,
			order_item_id,
			item_id,
			seller_id,
			amount,
			erlumeCommissionAmount,
			sellerPayoutAmount,
			currency,
			platform,
			income_type,
			received_at,
			notes,
		} = req.body;

		if (!amount) {
			res.status(400).json({
				success: false,
				error: "Missing required field: amount",
			});
			return;
		}

		if (order_id) {
			if (!mongoose.Types.ObjectId.isValid(order_id)) {
				res.status(400).json({ success: false, error: "Invalid order_id" });
				return;
			}
			const order = await Order.findById(order_id);
			if (!order) {
				res.status(404).json({ success: false, error: "Order not found" });
				return;
			}
		}

		if (order_item_id) {
			if (!mongoose.Types.ObjectId.isValid(order_item_id)) {
				res.status(400).json({
					success: false,
					error: "Invalid order_item_id",
				});
				return;
			}
			const orderItem = await OrderItem.findById(order_item_id);
			if (!orderItem) {
				res.status(404).json({
					success: false,
					error: "OrderItem not found",
				});
				return;
			}
		}

		if (item_id) {
			if (!mongoose.Types.ObjectId.isValid(item_id)) {
				res.status(400).json({ success: false, error: "Invalid item_id" });
				return;
			}
			const item = await Item.findById(item_id);
			if (!item) {
				res.status(404).json({ success: false, error: "Item not found" });
				return;
			}
		}

		if (seller_id) {
			if (!mongoose.Types.ObjectId.isValid(seller_id)) {
				res.status(400).json({ success: false, error: "Invalid seller_id" });
				return;
			}
			const seller = await User.findById(seller_id);
			if (!seller) {
				res.status(404).json({ success: false, error: "Seller not found" });
				return;
			}
		}

		const newIncome = new Income({
			order_id,
			order_item_id,
			item_id,
			seller_id,
			amount,
			erlumeCommissionAmount,
			sellerPayoutAmount,
			currency,
			platform,
			income_type,
			received_at: received_at ? new Date(received_at) : undefined,
			notes,
		});

		const savedIncome = await newIncome.save();

		res.status(201).json({
			success: true,
			message: "Income created successfully",
			data: savedIncome,
		});
	} catch (error: any) {
		console.error("Error in createIncome:", error);

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

const updateIncome = async (req: Request, res: Response): Promise<void> => {
	try {
		const incomeId = req.params.id;
		const update: any = { ...req.body };

		if (!mongoose.Types.ObjectId.isValid(incomeId)) {
			res.status(400).json({ success: false, error: "Invalid income ID" });
			return;
		}

		const income = await Income.findById(incomeId);
		if (!income) {
			res.status(404).json({ success: false, error: "Income not found" });
			return;
		}

		if (update.order_id !== undefined) {
			if (update.order_id === null || update.order_id === "") {
				update.order_id = undefined;
			} else if (!mongoose.Types.ObjectId.isValid(update.order_id)) {
				res.status(400).json({ success: false, error: "Invalid order_id" });
				return;
			} else {
				const order = await Order.findById(update.order_id);
				if (!order) {
					res.status(404).json({ success: false, error: "Order not found" });
					return;
				}
			}
		}

		if (update.order_item_id !== undefined) {
			if (update.order_item_id === null || update.order_item_id === "") {
				update.order_item_id = undefined;
			} else if (!mongoose.Types.ObjectId.isValid(update.order_item_id)) {
				res.status(400).json({
					success: false,
					error: "Invalid order_item_id",
				});
				return;
			} else {
				const orderItem = await OrderItem.findById(update.order_item_id);
				if (!orderItem) {
					res.status(404).json({
						success: false,
						error: "OrderItem not found",
					});
					return;
				}
			}
		}

		if (update.item_id !== undefined) {
			if (update.item_id === null || update.item_id === "") {
				update.item_id = undefined;
			} else if (!mongoose.Types.ObjectId.isValid(update.item_id)) {
				res.status(400).json({ success: false, error: "Invalid item_id" });
				return;
			} else {
				const item = await Item.findById(update.item_id);
				if (!item) {
					res.status(404).json({ success: false, error: "Item not found" });
					return;
				}
			}
		}

		if (update.seller_id !== undefined) {
			if (update.seller_id === null || update.seller_id === "") {
				update.seller_id = undefined;
			} else if (!mongoose.Types.ObjectId.isValid(update.seller_id)) {
				res.status(400).json({ success: false, error: "Invalid seller_id" });
				return;
			} else {
				const seller = await User.findById(update.seller_id);
				if (!seller) {
					res.status(404).json({ success: false, error: "Seller not found" });
					return;
				}
			}
		}

		if (update.received_at !== undefined) {
			update.received_at = update.received_at
				? new Date(update.received_at)
				: undefined;
		}

		const updatedIncome = await Income.findByIdAndUpdate(
			incomeId,
			{ $set: update },
			{ new: true, runValidators: true },
		);

		res.status(200).json({
			success: true,
			message: "Income updated successfully",
			data: updatedIncome,
		});
	} catch (error: any) {
		console.error("Error in updateIncome:", error);

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

const deleteIncome = async (req: Request, res: Response): Promise<void> => {
	try {
		const incomeId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(incomeId)) {
			res.status(400).json({ success: false, error: "Invalid income ID" });
			return;
		}

		const income = await Income.findById(incomeId);
		if (!income) {
			res.status(404).json({ success: false, error: "Income not found" });
			return;
		}

		await Income.findByIdAndDelete(incomeId);

		res.status(200).json({
			success: true,
			message: "Income deleted successfully",
			data: { id: incomeId },
		});
	} catch (error) {
		console.error("Error in deleteIncome:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getIncomes,
	getIncomeById,
	createIncome,
	updateIncome,
	deleteIncome,
};
