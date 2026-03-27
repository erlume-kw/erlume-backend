import { Request, Response } from "express";
import OrderItem from "../models/OrderItem";
import Order from "../models/Order";
import Item from "../models/Item";
import mongoose from "mongoose";
import { ItemStatus } from "../enums/statusEnums";

const getOrderItems = async (req: Request, res: Response): Promise<void> => {
	try {
		const orderItems = await OrderItem.find({})
			.populate("order_id")
			.populate("item_id");
		res.status(200).json({
			success: true,
			data: orderItems,
			count: orderItems.length,
		});
	} catch (error) {
		console.error("Error in getOrderItems:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getOrderItemsByOrderId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const orderId = req.params.orderId;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			res.status(400).json({ success: false, error: "Invalid order ID" });
			return;
		}

		const order = await Order.findById(orderId);
		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		const orderItems = await OrderItem.find({ order_id: orderId })
			.populate("order_id")
			.populate("item_id");

		res.status(200).json({
			success: true,
			data: orderItems,
			count: orderItems.length,
		});
	} catch (error) {
		console.error("Error in getOrderItemsByOrderId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getOrderItemById = async (req: Request, res: Response): Promise<void> => {
	try {
		const orderItemId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(orderItemId)) {
			res.status(400).json({ success: false, error: "Invalid order item ID" });
			return;
		}

		const orderItem = await OrderItem.findById(orderItemId)
			.populate("order_id")
			.populate("item_id");

		if (!orderItem) {
			res.status(404).json({ success: false, error: "Order item not found" });
			return;
		}

		res.status(200).json({ success: true, data: orderItem });
	} catch (error) {
		console.error("Error in getOrderItemById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createOrderItem = async (req: Request, res: Response): Promise<void> => {
	try {
		const { order_id, item_id, quantity, is_returned } = req.body;

		// Validate required fields
		if (!order_id || !item_id) {
			res.status(400).json({
				success: false,
				error: "Missing required fields: order_id, item_id",
			});
			return;
		}

		// Validate quantity
		if (quantity !== undefined && (isNaN(quantity) || quantity < 1)) {
			res.status(400).json({
				success: false,
				error: "Quantity must be a number greater than 0",
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

		// Validate item_id
		if (!mongoose.Types.ObjectId.isValid(item_id)) {
			res.status(400).json({ success: false, error: "Invalid item_id" });
			return;
		}

		const item = await Item.findById(item_id);
		if (!item) {
			res.status(404).json({ success: false, error: "Item not found" });
			return;
		}

		// Check if item is already ordered/sold
		if (item.orderId) {
			res.status(400).json({
				success: false,
				error: `Item ${item_id} is already sold or ordered`,
			});
			return;
		}

		// Check if item status is available
		if (item.itemStatus !== ItemStatus.Available) {
			res.status(400).json({
				success: false,
				error: `Item ${item_id} is not available (status: ${item.itemStatus}). Only items with status '${ItemStatus.Available}' can be ordered.`,
			});
			return;
		}

		// Calculate price at time of order (snapshot)
		const basePrice = parseFloat(item.basePrice);
		const saleRate = parseFloat(item.saleRate);
		const discountAmount = basePrice * saleRate;
		const finalPrice = (basePrice - discountAmount).toFixed(2);
		const orderQuantity = quantity || 1;

		// Create order item
		const newOrderItem = new OrderItem({
			order_id,
			item_id,
			quantity: orderQuantity,
			price: finalPrice, // Store price at time of order
			is_returned: is_returned || false,
		});

		const savedOrderItem = await newOrderItem.save();

		// Add order item ID to order's orderitem_ids array
		if (!order.orderitem_ids) {
			order.orderitem_ids = [];
		}
		order.orderitem_ids.push(savedOrderItem._id as any);
		await order.save();

		// Link item to order
		await Item.findByIdAndUpdate(item_id, { orderId: order_id });

		res.status(201).json({
			success: true,
			message: "Order item created successfully",
			data: savedOrderItem,
		});
	} catch (error: any) {
		console.error("Error in createOrderItem:", error);

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

const updateOrderItem = async (req: Request, res: Response): Promise<void> => {
	try {
		const orderItemId = req.params.id;
		const updateData = { ...req.body };

		if (!mongoose.Types.ObjectId.isValid(orderItemId)) {
			res.status(400).json({ success: false, error: "Invalid order item ID" });
			return;
		}

		const existingOrderItem = await OrderItem.findById(orderItemId);
		if (!existingOrderItem) {
			res.status(404).json({ success: false, error: "Order item not found" });
			return;
		}

		// Validate order_id if provided
		if (updateData.order_id) {
			if (!mongoose.Types.ObjectId.isValid(updateData.order_id)) {
				res.status(400).json({ success: false, error: "Invalid order_id" });
				return;
			}

			const order = await Order.findById(updateData.order_id);
			if (!order) {
				res.status(404).json({ success: false, error: "Order not found" });
				return;
			}
		}

		// Validate item_id if provided
		if (updateData.item_id) {
			if (!mongoose.Types.ObjectId.isValid(updateData.item_id)) {
				res.status(400).json({ success: false, error: "Invalid item_id" });
				return;
			}

			const item = await Item.findById(updateData.item_id);
			if (!item) {
				res.status(404).json({ success: false, error: "Item not found" });
				return;
			}
		}

		const updatedOrderItem = await OrderItem.findByIdAndUpdate(
			orderItemId,
			updateData,
			{ new: true, runValidators: true },
		);

		if (!updatedOrderItem) {
			res.status(404).json({ success: false, error: "Order item not found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: "Order item updated successfully",
			data: updatedOrderItem,
		});
	} catch (error: any) {
		console.error("Error in updateOrderItem:", error);

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

const deleteOrderItem = async (req: Request, res: Response): Promise<void> => {
	try {
		const orderItemId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(orderItemId)) {
			res.status(400).json({ success: false, error: "Invalid order item ID" });
			return;
		}

		const orderItem = await OrderItem.findById(orderItemId);
		if (!orderItem) {
			res.status(404).json({ success: false, error: "Order item not found" });
			return;
		}

		// Remove order item ID from order's orderitem_ids array
		await Order.updateMany(
			{ orderitem_ids: orderItemId },
			{ $pull: { orderitem_ids: orderItemId } },
		);

		// Delete order item
		await OrderItem.findByIdAndDelete(orderItemId);

		res.status(200).json({
			success: true,
			message: "Order item deleted successfully",
			data: { id: orderItemId },
		});
	} catch (error) {
		console.error("Error in deleteOrderItem:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const markOrderItemReturned = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const orderItemId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(orderItemId)) {
			res.status(400).json({ success: false, error: "Invalid order item ID" });
			return;
		}

		const orderItem = await OrderItem.findById(orderItemId);
		if (!orderItem) {
			res.status(404).json({ success: false, error: "Order item not found" });
			return;
		}

		const updatedOrderItem = await OrderItem.findByIdAndUpdate(
			orderItemId,
			{ is_returned: true },
			{ new: true },
		);

		res.status(200).json({
			success: true,
			message: "Order item marked as returned",
			data: updatedOrderItem,
		});
	} catch (error) {
		console.error("Error in markOrderItemReturned:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getOrderItems,
	getOrderItemsByOrderId,
	getOrderItemById,
	createOrderItem,
	updateOrderItem,
	deleteOrderItem,
	markOrderItemReturned,
};
