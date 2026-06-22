import { Request, Response } from "express";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import User from "../models/User";
import Item from "../models/Item";
import Seller from "../models/Seller";
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
import { assertSelfOrAdmin, isAdmin } from "../utils/rls";
import { sendOrderConfirmation, sendOrderStatusUpdate, type OrderItemSummary } from "../utils/notifications";

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

const createDeliveredFinancials = async (orderId: mongoose.Types.ObjectId | string) => {
	const orderItems = await OrderItem.find({ order_id: orderId }).lean();

	const incomeDocs: Array<Record<string, unknown>> = [];
	const saleDocs: Array<Record<string, unknown>> = [];

	// Accumulate total payout per seller — key is seller_id string
	const sellerPayoutMap = new Map<string, number>();

	for (const orderItem of orderItems) {
		const item = await Item.findById(orderItem.item_id).lean();
		if (!item) continue;

		const listingPrice = parseFloat(item.listingPrice);
		if (Number.isNaN(listingPrice)) continue;

		const orderQuantity = Number(orderItem.quantity) || 1;
		const lineTotal = (listingPrice * orderQuantity).toFixed(2);

		const saleRateValue = normalizeSaleRate(item.saleRate);
		const conditionDeduction = getConditionDeductionRate(item.condition);
		const adjustedAmount = Number(lineTotal) * (1 - conditionDeduction);
		const sellerPayout = (adjustedAmount * saleRateValue).toFixed(2);
		const erlumeCommission = (adjustedAmount * (1 - saleRateValue)).toFixed(2);

		incomeDocs.push({
			order_id: orderId,
			order_item_id: orderItem._id,
			item_id: orderItem.item_id,
			seller_id: item.seller_id ?? undefined,
			amount: erlumeCommission,
			received_at: new Date(),
		});

		saleDocs.push({
			order_id: orderId,
			order_item_id: orderItem._id,
			item_id: orderItem.item_id,
			amount: lineTotal,
			erlumeCommission,
			sellerPayout,
			erlumeCommissionAmount: erlumeCommission,
			sellerPayoutAmount: sellerPayout,
		});

		// Accumulate payout for this seller
		if (item.seller_id) {
			const sellerId = String(item.seller_id);
			sellerPayoutMap.set(sellerId, (sellerPayoutMap.get(sellerId) ?? 0) + parseFloat(sellerPayout));
		}
	}

	const transaction = await Transaction.findOne({ order_id: orderId });

	if (incomeDocs.length > 0) {
		await Income.insertMany(incomeDocs);
	}

	if (saleDocs.length > 0 && transaction) {
		const saleDocsWithTransaction = saleDocs.map((doc) => ({
			...doc,
			transaction_id: transaction._id,
		}));
		await Sale.insertMany(saleDocsWithTransaction);
	}

	if (transaction) {
		await Transaction.findByIdAndUpdate(transaction._id, {
			status: TransactionStatus.Completed,
		});
	}

	// Update each seller's balance
	for (const [sellerId, payoutAmount] of sellerPayoutMap.entries()) {
		const seller = await Seller.findOne({ userId: sellerId }).lean();
		if (!seller) continue;

		const currentBalance = parseFloat(String(seller.balance)) || 0;
		const newBalance = (currentBalance + payoutAmount).toFixed(3);

		await Seller.findByIdAndUpdate(seller._id, { balance: newBalance });
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
			.populate({
				path: "orderitem_ids",
				populate: {
					path: "item_id",
					select: "itemName brandName imageUrls listingPrice condition",
				},
			})
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

		if (!assertSelfOrAdmin(req, res, userId)) return;

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
			.populate({
				path: "orderitem_ids",
				populate: {
					path: "item_id",
					select: "itemName brandName imageUrls listingPrice condition",
				},
			})
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
			.populate({
				path: "orderitem_ids",
				populate: {
					path: "item_id",
					select: "itemName brandName imageUrls listingPrice condition",
				},
			});

		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		// Allow access for the order owner (registered) or guest orders
		if (order.user_id && !assertSelfOrAdmin(req, res, String(order.user_id))) return;

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
		const { user_id, guestInfo, orderItems, order_status } = req.body;

		// Must have either a registered user_id or guest info
		if (!user_id && !guestInfo) {
			res.status(400).json({
				success: false,
				error: "Either user_id or guestInfo is required",
			});
			return;
		}

		// Guest must provide at least phone or email
		if (!user_id && !guestInfo?.phoneNumber && !guestInfo?.emailAddress) {
			await session.abortTransaction();
			res.status(400).json({
				success: false,
				error: "Guest orders require at least a phone number or email address.",
			});
			return;
		}

		// Guest phone must not belong to a registered account
		if (guestInfo?.phoneNumber) {
			const existingUser = await User.findOne({
				phoneNumber: guestInfo.phoneNumber,
				isDeleted: false,
			}).session(session);
			if (existingUser) {
				await session.abortTransaction();
				res.status(409).json({
					success: false,
					error: "This phone number is linked to an existing account. Please log in to place your order.",
					code: "ACCOUNT_EXISTS",
				});
				return;
			}
		}

		// Registered user path — validate and fetch user
		let user: InstanceType<typeof User> | null = null;
		if (user_id) {
			if (!mongoose.Types.ObjectId.isValid(user_id)) {
				res.status(400).json({ success: false, error: "Invalid user_id" });
				return;
			}
			user = await User.findById(user_id).session(session);
			if (!user) {
				res.status(404).json({ success: false, error: "User not found" });
				return;
			}
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
			...(user_id ? { user_id } : {}),
			...(guestInfo ? { guestInfo } : {}),
			orderitem_ids: [],
			order_status: order_status || OrderStatus.Pending,
		});

		const savedOrder = await newOrder.save({ session });

		const createdOrderItemIds: mongoose.Types.ObjectId[] = [];
		const itemIds: mongoose.Types.ObjectId[] = [];
		const itemSummaries: OrderItemSummary[] = [];
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

			itemSummaries.push({
				itemName: item.itemName,
				brandName: item.brandName,
				quantity: orderQuantity,
				price: finalPrice,
			});

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
		}

		savedOrder.orderitem_ids = createdOrderItemIds;
		await savedOrder.save({ session });

		if (itemIds.length > 0) {
			await Item.updateMany(
				{ _id: { $in: itemIds } },
				{ orderId: savedOrder._id, itemStatus: ItemStatus.Sold },
				{ session },
			);
		}

		// Create pending transaction
		const existingTransaction = await Transaction.findOne({ order_id: savedOrder._id }).session(session);
		if (!existingTransaction) {
			await Transaction.create(
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
		} else if (existingTransaction.amount !== totalAmount.toFixed(2)) {
			existingTransaction.amount = totalAmount.toFixed(2);
			await existingTransaction.save({ session });
		}

		await session.commitTransaction();

		const notifPhone = user ? user.phoneNumber : guestInfo?.phoneNumber;
		const notifEmail = user ? user.emailAddress : (guestInfo?.emailAddress ?? "");
		const customerName = user
			? (user.emailAddress ?? notifPhone ?? "Customer")
			: (guestInfo?.name ?? guestInfo?.phoneNumber ?? "Guest");

		// WhatsApp + Zoho invoice are sent from createTransaction
		// so the customer gets the correct (discounted) total and invoice link in one flow

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
		const status = req.body.status ?? req.body.order_status;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			res.status(400).json({ success: false, error: "Invalid order ID" });
			return;
		}

		if (!status) {
			res.status(400).json({
				success: false,
				error: "Missing required field: status or order_status",
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
			await createDeliveredFinancials(orderId);
		}

		if (status === OrderStatus.Cancelled) {
			const orderItems = await OrderItem.find({ order_id: orderId }).lean();
			const itemIds = orderItems.map((oi) => oi.item_id).filter(Boolean) as mongoose.Types.ObjectId[];
			if (itemIds.length > 0) {
				await Item.updateMany(
					{ _id: { $in: itemIds } },
					{ $unset: { orderId: "" }, itemStatus: ItemStatus.Available },
				);
			}
			await Transaction.findOneAndUpdate(
				{ order_id: orderId },
				{ status: TransactionStatus.Failed },
			);
		}

		const notifPhone = order.user_id
			? (await User.findById(order.user_id))?.phoneNumber
			: (order as any).guestInfo?.phoneNumber;
		const notifEmail = order.user_id
			? (await User.findById(order.user_id))?.emailAddress ?? ""
			: (order as any).guestInfo?.emailAddress ?? "";
		if (notifPhone) {
			void sendOrderStatusUpdate({ emailAddress: notifEmail, phoneNumber: notifPhone, orderId, status });
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
			await createDeliveredFinancials(orderId);
		}

		if (update.order_status === OrderStatus.Cancelled) {
			const orderItems = await OrderItem.find({ order_id: orderId }).lean();
			const itemIds = orderItems
				.map((oi) => oi.item_id)
				.filter(Boolean) as mongoose.Types.ObjectId[];
			if (itemIds.length > 0) {
				await Item.updateMany(
					{ _id: { $in: itemIds } },
					{ $unset: { orderId: "" }, itemStatus: ItemStatus.Available },
				);
			}
			await Transaction.findOneAndUpdate(
				{ order_id: orderId },
				{ status: TransactionStatus.Failed },
			);
		}

		if (update.order_status) {
			const orderUser = order.user_id ? await User.findById(order.user_id) : null;
			const notifPhone = orderUser?.phoneNumber ?? (order as any).guestInfo?.phoneNumber;
			const notifEmail = orderUser?.emailAddress ?? (order as any).guestInfo?.emailAddress ?? "";
			if (notifPhone) {
				void sendOrderStatusUpdate({
					emailAddress: notifEmail,
					phoneNumber: notifPhone,
					orderId,
					status: update.order_status as string,
					trackingReference: update.trackingReference as string | undefined,
				});
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

/* ─── POST /api/orders/validate-cart ─────────────────────────────────────────
   Pre-checkout availability check. Call this before showing the payment screen.
   Body: { item_ids: string[] }
   Returns which items are available and which are not, so the frontend can
   remove unavailable ones before the user hits checkout.
────────────────────────────────────────────────────────────────────────────── */

const validateCart = async (req: Request, res: Response): Promise<void> => {
	try {
		const { item_ids } = req.body;

		if (!Array.isArray(item_ids) || item_ids.length === 0) {
			res.status(400).json({
				success: false,
				error: "item_ids must be a non-empty array",
			});
			return;
		}

		// Validate all IDs are valid ObjectIds
		const invalidIds = item_ids.filter(
			(id: any) => !mongoose.Types.ObjectId.isValid(id),
		);
		if (invalidIds.length > 0) {
			res.status(400).json({
				success: false,
				error: `Invalid item IDs: ${invalidIds.join(", ")}`,
			});
			return;
		}

		// Fetch all items in one query
		const items = await Item.find({ _id: { $in: item_ids } }).lean();

		// Map results
		const foundIds = new Set(items.map((i) => String(i._id)));

		const available: string[] = [];
		const unavailable: Array<{ item_id: string; reason: string }> = [];

		for (const id of item_ids) {
			if (!foundIds.has(id)) {
				unavailable.push({ item_id: id, reason: "Item not found" });
				continue;
			}

			const item = items.find((i) => String(i._id) === id)!;

			if (item.itemStatus !== ItemStatus.Available) {
				unavailable.push({
					item_id: id,
					reason: `Item is ${item.itemStatus}`,
				});
			} else {
				available.push(id);
			}
		}

		res.status(200).json({
			success: true,
			data: {
				valid: unavailable.length === 0,
				available,
				unavailable,
				summary: `${available.length} available, ${unavailable.length} unavailable`,
			},
		});
	} catch (error) {
		console.error("Error in validateCart:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getGuestOrder = async (req: Request, res: Response): Promise<void> => {
	try {
		const { orderId } = req.params;
		const { phone, email } = req.query;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			res.status(400).json({ success: false, error: "Invalid order ID" });
			return;
		}

		if (!phone && !email) {
			res.status(400).json({ success: false, error: "Phone number or email address is required" });
			return;
		}

		const order = await Order.findById(orderId).populate({
			path: "orderitem_ids",
			populate: {
				path: "item_id",
				select: "itemName brandName imageUrls listingPrice condition",
			},
		});

		if (!order || !order.guestInfo) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		const normalise = (s: string) => s.replace(/[\s\-]/g, "").toLowerCase();

		if (phone && typeof phone === "string") {
			if (!order.guestInfo.phoneNumber || normalise(phone) !== normalise(order.guestInfo.phoneNumber)) {
				res.status(403).json({ success: false, error: "Phone number does not match this order" });
				return;
			}
		} else if (email && typeof email === "string") {
			if (!order.guestInfo.emailAddress || normalise(email) !== normalise(order.guestInfo.emailAddress)) {
				res.status(403).json({ success: false, error: "Email address does not match this order" });
				return;
			}
		}

		res.status(200).json({ success: true, data: order });
	} catch (error) {
		console.error("Error in getGuestOrder:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getOrders,
	getOrdersByUserId,
	getOrderById,
	getGuestOrder,
	createOrder,
	updateOrderStatus,
	updateOrder,
	deleteOrder,
	validateCart,
};
