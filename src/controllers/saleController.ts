import { Request, Response } from "express";
import mongoose from "mongoose";
import Sale from "../models/Sale";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Transaction from "../models/Transaction";
import Item from "../models/Item";
import { getMonthYearDateRange } from "../utils/dateRange";
import { sendError } from "../utils/sendError";
import { ItemCondition } from "../enums/itemEnums";

const normalizeSaleRate = (value: unknown): number => {
	const numeric = Number(value);
	if (Number.isNaN(numeric)) {
		return 0;
	}
	const normalized = numeric > 1 ? numeric / 100 : numeric;
	if (normalized < 0 || normalized > 1) {
		return 0;
	}
	return normalized;
};

const getConditionDeductionRate = (condition?: ItemCondition | string): number => {
	switch (condition) {
		case ItemCondition.GentlyUsed:
			return 0.05;
		case ItemCondition.Fair:
		case ItemCondition.Worn:
			return 0.1;
		case ItemCondition.New:
		case ItemCondition.LikeNew:
		default:
			return 0;
	}
};

const escapeRegex = (value: string): string =>
	value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseBagRecord = (
	bagRecord: unknown,
): { itemName: string; brandName: string; year?: string } | null => {
	if (typeof bagRecord !== "string") return null;
	const parts = bagRecord.split("-").map((part) => part.trim());
	if (parts.length < 2) return null;
	const brandName = parts[parts.length - 2];
	const year = parts[parts.length - 1] || undefined;
	const itemName = parts.slice(0, -2).join("-").trim();
	if (!itemName || !brandName) return null;
	return { itemName, brandName, year };
};

const findItemByBagRecord = async (
	bagRecord: unknown,
): Promise<{ saleRate?: string; condition?: string } | null> => {
	const parsed = parseBagRecord(bagRecord);
	if (!parsed) return null;
	const query: Record<string, unknown> = {
		itemName: new RegExp(`^${escapeRegex(parsed.itemName)}$`, "i"),
		brandName: new RegExp(`^${escapeRegex(parsed.brandName)}$`, "i"),
	};
	if (parsed.year) {
		query.year = parsed.year;
	}
	return await Item.findOne(query).select("saleRate condition").lean();
};

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
			.populate("item_id")
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

const recalculateSaleCommissions = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const sales = await Sale.find({})
			.select("_id amount item_id order_item_id bag_record")
			.lean();

		const orderItemCache = new Map<string, string | null>();
		const itemCache = new Map<
			string,
			{ saleRate?: string | null; condition?: string | null }
		>();

		const bulkOps: Array<any> = [];
		let updatedCount = 0;
		let skippedCount = 0;

		for (const sale of sales) {
			if (!sale.amount) {
				skippedCount += 1;
				continue;
			}

			let itemId = sale.item_id ? String(sale.item_id) : undefined;
			if (!itemId && sale.order_item_id) {
				const orderItemId = String(sale.order_item_id);
				if (orderItemCache.has(orderItemId)) {
					itemId = orderItemCache.get(orderItemId) ?? undefined;
				} else {
					const orderItem = await OrderItem.findById(orderItemId)
						.select("item_id")
						.lean();
					const resolvedItemId = orderItem?.item_id
						? String(orderItem.item_id)
						: null;
					orderItemCache.set(orderItemId, resolvedItemId);
					itemId = resolvedItemId ?? undefined;
				}
			}

			let saleRateValue: string | null | undefined;
			let conditionValue: string | undefined;
			if (itemId) {
				if (itemCache.has(itemId)) {
					const cached = itemCache.get(itemId);
					saleRateValue = cached?.saleRate ?? undefined;
					conditionValue = cached?.condition ?? undefined;
				} else {
					const item = await Item.findById(itemId)
						.select("saleRate condition")
						.lean();
					saleRateValue = item?.saleRate ?? null;
					conditionValue = item?.condition ?? undefined;
					itemCache.set(itemId, { saleRate: saleRateValue, condition: conditionValue });
				}
			} else if (sale.bag_record) {
				const item = await findItemByBagRecord(sale.bag_record);
				saleRateValue = item?.saleRate ?? null;
				conditionValue = item?.condition ?? undefined;
			} else {
				skippedCount += 1;
				continue;
			}

			const rate = normalizeSaleRate(saleRateValue);
			const conditionDeduction = getConditionDeductionRate(conditionValue);
			const amountValue = Number(sale.amount);
			if (Number.isNaN(amountValue)) {
				skippedCount += 1;
				continue;
			}

			const adjustedAmount = amountValue * (1 - conditionDeduction);
			const sellerPayout = (adjustedAmount * rate).toFixed(2);
			const erlumeCommission = (adjustedAmount * (1 - rate)).toFixed(2);

			bulkOps.push({
				updateOne: {
					filter: { _id: sale._id },
					update: {
						$set: {
							erlumeCommission,
							sellerPayout,
							erlumeCommissionAmount: erlumeCommission,
							sellerPayoutAmount: sellerPayout,
						},
					},
				},
			});
			updatedCount += 1;
		}

		if (bulkOps.length > 0) {
			await Sale.bulkWrite(bulkOps);
		}

		res.status(200).json({
			success: true,
			message: "Sale commissions recalculated",
			data: { updatedCount, skippedCount, total: sales.length },
		});
	} catch (error) {
		console.error("Error in recalculateSaleCommissions:", error);
		sendError(res, 500, "Internal server error", "INTERNAL_ERROR");
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
			.populate("item_id")
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
			.populate("item_id")
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
			item_id,
			transaction_id,
			amount,
			listingPrice,
			erlumeCommission,
			sellerPayout,
			buyer,
			status,
			sale_date,
			bag_record,
			invoice_number,
			invoice_url,
			payment_evidence_url,
		} = req.body;

		const hasOrderFlow = order_id && order_item_id;
		const hasPrelaunchFlow = amount != null || buyer || bag_record;

		if (!hasOrderFlow && !hasPrelaunchFlow) {
			res.status(400).json({
				success: false,
				error:
					"Provide order_id+order_item_id (order flow) or amount/buyer/bag_record (prelaunch flow)",
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

		let orderItem = null as any;
		if (order_item_id) {
			if (!mongoose.Types.ObjectId.isValid(order_item_id)) {
				res.status(400).json({
					success: false,
					error: "Invalid order_item_id",
				});
				return;
			}
			orderItem = await OrderItem.findById(order_item_id);
			if (!orderItem) {
				res.status(404).json({ success: false, error: "Order item not found" });
				return;
			}
		}

		let itemIdToUse = item_id;
		let resolvedSaleRateSource: unknown;
		let resolvedConditionSource: string | undefined;
		if (!itemIdToUse && orderItem) {
			itemIdToUse = String(orderItem.item_id);
		}
		if (itemIdToUse) {
			if (!mongoose.Types.ObjectId.isValid(itemIdToUse)) {
				res.status(400).json({ success: false, error: "Invalid item_id" });
				return;
			}
			const item = await Item.findById(itemIdToUse);
			if (!item) {
				res.status(404).json({ success: false, error: "Item not found" });
				return;
			}
			resolvedSaleRateSource = item.saleRate;
			resolvedConditionSource = item.condition as string | undefined;
		} else if (bag_record) {
			const item = await findItemByBagRecord(bag_record);
			resolvedSaleRateSource = item?.saleRate;
			resolvedConditionSource = item?.condition;
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
				res.status(404).json({ success: false, error: "Transaction not found" });
				return;
			}
		}

		const resolvedAmount =
			amount != null && amount !== "" ? Number(amount) : null;
		const safeSaleRate = normalizeSaleRate(resolvedSaleRateSource);
		const conditionDeduction = getConditionDeductionRate(resolvedConditionSource);
		const adjustedAmount =
			resolvedAmount != null
				? resolvedAmount * (1 - conditionDeduction)
				: null;
		const computedSellerPayout =
			adjustedAmount != null
				? (adjustedAmount * safeSaleRate).toFixed(2)
				: undefined;
		const computedErlumeCommission =
			adjustedAmount != null
				? (adjustedAmount * (1 - safeSaleRate)).toFixed(2)
				: undefined;

		const newSale = new Sale({
			order_id: order_id || undefined,
			order_item_id: order_item_id || undefined,
			item_id: item_id || undefined,
			transaction_id: transaction_id || undefined,
			amount,
			listingPrice,
			erlumeCommission: computedErlumeCommission ?? erlumeCommission,
			sellerPayout: computedSellerPayout ?? sellerPayout,
			erlumeCommissionAmount: computedErlumeCommission ?? erlumeCommission,
			sellerPayoutAmount: computedSellerPayout ?? sellerPayout,
			buyer,
			status,
			sale_date: sale_date ? new Date(sale_date) : undefined,
			bag_record,
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
		const {
			transaction_id,
			amount,
			listingPrice,
			erlumeCommission,
			sellerPayout,
			buyer,
			status,
			sale_date,
			bag_record,
			invoice_number,
			invoice_url,
			payment_evidence_url,
		} = req.body;

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

		let computedErlumeCommission: string | undefined;
		let computedSellerPayout: string | undefined;
		let saleRateForCalc: number | undefined;
		let conditionForCalc: string | undefined;
		if (sale.item_id) {
			const item = await Item.findById(sale.item_id);
			if (item) {
				saleRateForCalc = normalizeSaleRate(item.saleRate);
				conditionForCalc = item.condition as string | undefined;
			}
		} else if (sale.bag_record) {
			const item = await findItemByBagRecord(sale.bag_record);
			if (item?.saleRate) {
				saleRateForCalc = normalizeSaleRate(item.saleRate);
				conditionForCalc = item.condition;
			}
		}
		if (amount !== undefined) {
			update.amount = amount;
			if (amount !== null && amount !== "") {
				const numericAmount = Number(amount);
				if (!Number.isNaN(numericAmount)) {
					const rate = saleRateForCalc ?? 0;
					const conditionDeduction =
						getConditionDeductionRate(conditionForCalc);
					const adjustedAmount =
						numericAmount * (1 - conditionDeduction);
					computedSellerPayout = (adjustedAmount * rate).toFixed(2);
					computedErlumeCommission = (adjustedAmount * (1 - rate)).toFixed(2);
				}
			}
		}
		if (listingPrice !== undefined) update.listingPrice = listingPrice;
		if (computedErlumeCommission !== undefined) {
			update.erlumeCommission = computedErlumeCommission;
			update.erlumeCommissionAmount = computedErlumeCommission;
		} else if (erlumeCommission !== undefined) {
			update.erlumeCommission = erlumeCommission;
			update.erlumeCommissionAmount = erlumeCommission;
		}
		if (computedSellerPayout !== undefined) {
			update.sellerPayout = computedSellerPayout;
			update.sellerPayoutAmount = computedSellerPayout;
		} else if (sellerPayout !== undefined) {
			update.sellerPayout = sellerPayout;
			update.sellerPayoutAmount = sellerPayout;
		}
		if (buyer !== undefined) update.buyer = buyer;
		if (status !== undefined) update.status = status;
		if (sale_date !== undefined)
			update.sale_date =
				sale_date == null || sale_date === "" ? undefined : new Date(sale_date);
		if (bag_record !== undefined) update.bag_record = bag_record;

		const updatedSale = await Sale.findByIdAndUpdate(
			saleId,
			{ $set: update },
			{ new: true, runValidators: true },
		)
			.populate("order_id")
			.populate("order_item_id")
			.populate("item_id")
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
	recalculateSaleCommissions,
};
