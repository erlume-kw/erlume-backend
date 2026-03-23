import { Request, Response } from "express";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import User from "../models/User";
import Item from "../models/Item";
import Income from "../models/Income";
import Transaction from "../models/Transaction";
import Sale from "../models/Sale";
import mongoose from "mongoose";
import { OrderStatus } from "../enums/orderEnums";
import { ItemStatus } from "../enums/statusEnums";
import { TransactionStatus } from "../enums/transactionEnums";
import { DeliveryStatus } from "../enums/flowEnums";
import { getMonthYearDateRange } from "../utils/dateRange";
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

const markOrderItemsSold = async (orderId: mongoose.Types.ObjectId | string) => {
	const orderItems = await OrderItem.find({ order_id: orderId })
		.select("item_id")
		.lean();
	const itemIds = orderItems
		.map((item) => item.item_id)
		.filter(Boolean);
	if (itemIds.length > 0) {
		await Item.updateMany(
			{ _id: { $in: itemIds } },
			{ itemStatus: ItemStatus.Sold },
		);
	}
};

const getOrders = async (req: Request, res: Response): Promise<void> => {
	try {
		const { status, year, month } = req.query;

		const query: any = {};
		const { range, error } = getMonthYearDateRange(year, month);
		if (error) {
			res.status(400).json({ success: false, error });
			return;
		}
		if (range) {
			query.createdAt = range;
		}
		if (status) {
			if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
				res.status(400).json({
					success: false,
					error: `Invalid status. Must be one of: ${Object.values(
						OrderStatus,
					).join(", ")}`,
				});
				return;
			}
			query.order_status = status;
		}

		const orders = await Order.find(query)
			.populate("user_id")
			.populate("orderitem_ids")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			data: orders,
			count: orders.length,
		});
	} catch (error) {
		console.error("Error in getOrders:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getOrdersByUserId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const userId = req.params.userId;
		const { year, month } = req.query;

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			res.status(400).json({ success: false, error: "Invalid user ID" });
			return;
		}

		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ success: false, error: "User not found" });
			return;
		}

		const query: any = { user_id: userId };
		const { range, error } = getMonthYearDateRange(year, month);
		if (error) {
			res.status(400).json({ success: false, error });
			return;
		}
		if (range) {
			query.createdAt = range;
		}

		const orders = await Order.find(query)
			.populate("user_id")
			.populate("orderitem_ids")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			data: orders,
			count: orders.length,
		});
	} catch (error) {
		console.error("Error in getOrdersByUserId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getOrderById = async (req: Request, res: Response): Promise<void> => {
	try {
		const orderId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			res.status(400).json({ success: false, error: "Invalid order ID" });
			return;
		}

		const order = await Order.findById(orderId)
			.populate("user_id")
			.populate("orderitem_ids");

		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		res.status(200).json({ success: true, data: order });
	} catch (error) {
		console.error("Error in getOrderById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createOrder = async (req: Request, res: Response): Promise<void> => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { user_id, orderItems, order_status } = req.body;

		// Validate required fields
		if (!user_id) {
			res.status(400).json({
				success: false,
				error: "Missing required field: user_id",
			});
			return;
		}

		// Validate user_id
		if (!mongoose.Types.ObjectId.isValid(user_id)) {
			res.status(400).json({ success: false, error: "Invalid user_id" });
			return;
		}

		const user = await User.findById(user_id).session(session);
		if (!user) {
			res.status(404).json({ success: false, error: "User not found" });
			return;
		}

		// Validate order_status if provided
		if (order_status && !Object.values(OrderStatus).includes(order_status)) {
			res.status(400).json({
				success: false,
				error: `Invalid order_status. Must be one of: ${Object.values(
					OrderStatus,
				).join(", ")}`,
			});
			return;
		}

		// Validate orderItems
		if (!Array.isArray(orderItems)) {
			res.status(400).json({
				success: false,
				error: "orderItems must be an array",
			});
			return;
		}

		if (orderItems.length === 0) {
			res.status(400).json({
				success: false,
				error: "orderItems must contain at least one item",
			});
			return;
		}

		// Check for duplicate items in the order
		const itemIdsInOrder = orderItems.map((oi: any) => oi.item_id).filter(Boolean);
		const uniqueItemIds = new Set(itemIdsInOrder);
		if (itemIdsInOrder.length !== uniqueItemIds.size) {
			res.status(400).json({
				success: false,
				error: "Duplicate items are not allowed in the same order. Each item can only be added once.",
			});
			return;
		}

		// Create order
		const newOrder = new Order({
			user_id,
			orderitem_ids: [],
			order_status: order_status || OrderStatus.Pending,
		});

		const savedOrder = await newOrder.save({ session });

		const createdOrderItemIds: mongoose.Types.ObjectId[] = [];
		const itemIds: mongoose.Types.ObjectId[] = [];
		const incomeDocs: Array<Record<string, unknown>> = [];
		const saleDocs: Array<Record<string, unknown>> = [];
		let totalAmount = 0;

		for (const orderItemInput of orderItems) {
			const { item_id, quantity, is_returned } = orderItemInput ?? {};

			if (!item_id) {
				res.status(400).json({
					success: false,
					error: "Each order item must include item_id",
				});
				await session.abortTransaction();
				return;
			}

			if (quantity !== undefined && (isNaN(quantity) || quantity < 1)) {
				res.status(400).json({
					success: false,
					error: "Quantity must be a number greater than 0",
				});
				await session.abortTransaction();
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(item_id)) {
				res.status(400).json({
					success: false,
					error: `Invalid item_id: ${item_id}`,
				});
				await session.abortTransaction();
				return;
			}

			const item = await Item.findById(item_id).session(session);
			if (!item) {
				res.status(404).json({
					success: false,
					error: `Item not found: ${item_id}`,
				});
				await session.abortTransaction();
				return;
			}

			// Check if item is already ordered/sold
			// Only reject if orderId exists AND the order is not cancelled/deleted
			if (item.orderId) {
				const existingOrder = await Order.findById(item.orderId).session(session);
				// If order doesn't exist (was deleted) or is cancelled, allow re-ordering
				if (existingOrder && existingOrder.order_status !== OrderStatus.Cancelled) {
					res.status(400).json({
						success: false,
						error: `Item ${item_id} is already sold or ordered (order status: ${existingOrder.order_status})`,
					});
					await session.abortTransaction();
					return;
				}
				// If order was deleted or cancelled, clear the stale orderId
				if (!existingOrder || existingOrder.order_status === OrderStatus.Cancelled) {
					await Item.findByIdAndUpdate(
						item_id,
						{ $unset: { orderId: "" } },
						{ session },
					);
				}
			}

			// Check if item status is available
			if (item.itemStatus !== ItemStatus.Available) {
				res.status(400).json({
					success: false,
					error: `Item ${item_id} is not available (status: ${item.itemStatus}). Only items with status '${ItemStatus.Available}' can be ordered.`,
				});
				await session.abortTransaction();
				return;
			}

			const listingPrice = parseFloat(item.listingPrice);
			if (Number.isNaN(listingPrice)) {
				res.status(400).json({
					success: false,
					error: `Invalid listingPrice for item: ${item_id}`,
				});
				await session.abortTransaction();
				return;
			}
			const finalPrice = listingPrice.toFixed(2);
			const orderQuantity = quantity || 1;

			const createdOrderItem = await OrderItem.create(
				[
					{
						order_id: savedOrder._id,
						item_id,
						quantity: orderQuantity,
						price: finalPrice,
						is_returned: is_returned || false,
					},
				],
				{ session },
			);

			createdOrderItemIds.push(
				createdOrderItem[0]._id as mongoose.Types.ObjectId,
			);
			itemIds.push(item._id as mongoose.Types.ObjectId);

			const lineTotal = (listingPrice * Number(orderQuantity)).toFixed(2);
			totalAmount += Number(lineTotal);

			const saleRateValue = normalizeSaleRate(item.saleRate);
			const conditionDeduction = getConditionDeductionRate(item.condition);
			const adjustedAmount =
				Number(lineTotal) * (1 - conditionDeduction);
			const sellerPayout = (adjustedAmount * saleRateValue).toFixed(2);
			const erlumeCommission = (
				adjustedAmount * (1 - saleRateValue)
			).toFixed(2);

			incomeDocs.push({
				order_id: savedOrder._id,
				order_item_id: createdOrderItem[0]._id,
				item_id,
				seller_id: item.seller_id ?? undefined,
				amount: erlumeCommission,
				received_at: new Date(),
			});

			saleDocs.push({
				order_id: savedOrder._id,
				order_item_id: createdOrderItem[0]._id,
				item_id,
				amount: lineTotal,
				erlumeCommission,
				sellerPayout,
			});
		}

		savedOrder.orderitem_ids = createdOrderItemIds;
		await savedOrder.save({ session });

		if (itemIds.length > 0) {
			await Item.updateMany(
				{ _id: { $in: itemIds } },
				{ orderId: savedOrder._id },
				{ session },
			);
		}

		if (incomeDocs.length > 0) {
			await Income.insertMany(incomeDocs, { session });
		}

		// Check if transaction already exists for this order (prevent duplicates)
		let transaction = await Transaction.findOne({ order_id: savedOrder._id }).session(session);
		
		if (!transaction) {
			// Create transaction only if it doesn't exist
			const createdTransactions = await Transaction.create(
				[
					{
						order_id: savedOrder._id,
						discount_rate: "0",
						amount: totalAmount.toFixed(2),
						status: TransactionStatus.Pending,
					},
				],
				{ session },
			);
			transaction = createdTransactions[0];
		} else {
			// Transaction already exists - update amount if needed (optional)
			// This ensures the transaction amount matches the current order total
			if (transaction.amount !== totalAmount.toFixed(2)) {
				transaction.amount = totalAmount.toFixed(2);
				await transaction.save({ session });
			}
		}

		if (saleDocs.length > 0) {
			const saleDocsWithTransaction = saleDocs.map((doc) => ({
				...doc,
				transaction_id: transaction._id,
			}));
			await Sale.insertMany(saleDocsWithTransaction, { session });
		}

		await session.commitTransaction();

		res.status(201).json({
			success: true,
			message: "Order created successfully",
			data: savedOrder,
		});
	} catch (error: any) {
		await session.abortTransaction();
		console.error("Error in createOrder:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		// Handle duplicate transaction error (unique constraint violation)
		if (error.code === 11000 || error.message?.includes("duplicate")) {
			res.status(400).json({
				success: false,
				error: "Transaction already exists for this order",
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	} finally {
		session.endSession();
	}
};

const updateOrderStatus = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const orderId = req.params.id;
		const { status } = req.body;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			res.status(400).json({ success: false, error: "Invalid order ID" });
			return;
		}

		if (!status) {
			res.status(400).json({
				success: false,
				error: "Missing required field: status",
			});
			return;
		}

		if (!Object.values(OrderStatus).includes(status)) {
			res.status(400).json({
				success: false,
				error: `Invalid status. Must be one of: ${Object.values(
					OrderStatus,
				).join(", ")}`,
			});
			return;
		}

		const order = await Order.findById(orderId);
		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		const updatedOrder = await Order.findByIdAndUpdate(
			orderId,
			{ order_status: status },
			{ new: true, runValidators: true },
		);

		if (status === OrderStatus.Delivered) {
			await markOrderItemsSold(orderId);
		}

		res.status(200).json({
			success: true,
			message: "Order status updated successfully",
			data: updatedOrder,
		});
	} catch (error: any) {
		console.error("Error in updateOrderStatus:", error);

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

/** Partial update: order_status, deliveryDate, deliveryStatus, trackingReference */
const updateOrder = async (req: Request, res: Response): Promise<void> => {
	try {
		const orderId = req.params.id;
		const body = req.body as Record<string, unknown>;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			res.status(400).json({ success: false, error: "Invalid order ID" });
			return;
		}

		const order = await Order.findById(orderId);
		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		const update: Record<string, unknown> = {};
		if (body.order_status !== undefined) {
			if (
				!Object.values(OrderStatus).includes(body.order_status as OrderStatus)
			) {
				res.status(400).json({
					success: false,
					error: `Invalid order_status. Must be one of: ${Object.values(
						OrderStatus,
					).join(", ")}`,
				});
				return;
			}
			update.order_status = body.order_status;
		}
		if (body.deliveryDate !== undefined) {
			update.deliveryDate =
				body.deliveryDate == null || body.deliveryDate === ""
					? undefined
					: new Date(body.deliveryDate as string);
		}
		if (body.deliveryStatus !== undefined) {
			if (
				body.deliveryStatus != null &&
				body.deliveryStatus !== "" &&
				!Object.values(DeliveryStatus).includes(
					body.deliveryStatus as DeliveryStatus,
				)
			) {
				res.status(400).json({
					success: false,
					error: `Invalid deliveryStatus. Must be one of: ${Object.values(
						DeliveryStatus,
					).join(", ")}`,
				});
				return;
			}
			update.deliveryStatus =
				body.deliveryStatus == null || body.deliveryStatus === ""
					? undefined
					: body.deliveryStatus;
		}
		if (body.trackingReference !== undefined) {
			update.trackingReference =
				body.trackingReference == null || body.trackingReference === ""
					? undefined
					: String(body.trackingReference);
		}

		if (Object.keys(update).length === 0) {
			res
				.status(200)
				.json({ success: true, message: "Nothing to update", data: order });
			return;
		}

		const updatedOrder = await Order.findByIdAndUpdate(
			orderId,
			{ $set: update },
			{ new: true, runValidators: true },
		);

		if (update.order_status === OrderStatus.Delivered) {
			await markOrderItemsSold(orderId);
		}

		// If order is cancelled, clear orderId from items so they can be ordered again
		if (update.order_status === OrderStatus.Cancelled) {
			const orderItems = await OrderItem.find({ order_id: orderId });
			const itemIds = orderItems
				.map((oi) => oi.item_id)
				.filter(Boolean) as mongoose.Types.ObjectId[];
			if (itemIds.length > 0) {
				await Item.updateMany(
					{ _id: { $in: itemIds }, orderId: orderId },
					{ $unset: { orderId: "" } },
				);
			}
		}

		res.status(200).json({
			success: true,
			message: "Order updated successfully",
			data: updatedOrder,
		});
	} catch (error: any) {
		console.error("Error in updateOrder:", error);
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

const deleteOrder = async (req: Request, res: Response): Promise<void> => {
	try {
		const orderId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			res.status(400).json({ success: false, error: "Invalid order ID" });
			return;
		}

		const order = await Order.findById(orderId);
		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		// Get all order items to clear orderId from items
		const orderItems = await OrderItem.find({ order_id: orderId });
		const itemIds = orderItems
			.map((oi) => oi.item_id)
			.filter(Boolean) as mongoose.Types.ObjectId[];

		// Delete order (cascade delete will handle OrderItems)
		await Order.findByIdAndDelete(orderId);

		// Clear orderId from items so they can be ordered again
		if (itemIds.length > 0) {
			await Item.updateMany(
				{ _id: { $in: itemIds }, orderId: orderId },
				{ $unset: { orderId: "" } },
			);
		}

		res.status(200).json({
			success: true,
			message: "Order deleted successfully",
			data: { id: orderId },
		});
	} catch (error) {
		console.error("Error in deleteOrder:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getOrders,
	getOrdersByUserId,
	getOrderById,
	createOrder,
	updateOrderStatus,
	updateOrder,
	deleteOrder,
};
