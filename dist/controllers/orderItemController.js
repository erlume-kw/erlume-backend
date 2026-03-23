"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const Order_1 = __importDefault(require("../models/Order"));
const Item_1 = __importDefault(require("../models/Item"));
const mongoose_1 = __importDefault(require("mongoose"));
const statusEnums_1 = require("../enums/statusEnums");
const getOrderItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderItems = yield OrderItem_1.default.find({})
            .populate("order_id")
            .populate("item_id");
        res.status(200).json({
            success: true,
            data: orderItems,
            count: orderItems.length,
        });
    }
    catch (error) {
        console.error("Error in getOrderItems:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getOrderItemsByOrderId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.orderId;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({ success: false, error: "Invalid order ID" });
            return;
        }
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, error: "Order not found" });
            return;
        }
        const orderItems = yield OrderItem_1.default.find({ order_id: orderId })
            .populate("order_id")
            .populate("item_id");
        res.status(200).json({
            success: true,
            data: orderItems,
            count: orderItems.length,
        });
    }
    catch (error) {
        console.error("Error in getOrderItemsByOrderId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getOrderItemById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderItemId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderItemId)) {
            res.status(400).json({ success: false, error: "Invalid order item ID" });
            return;
        }
        const orderItem = yield OrderItem_1.default.findById(orderItemId)
            .populate("order_id")
            .populate("item_id");
        if (!orderItem) {
            res.status(404).json({ success: false, error: "Order item not found" });
            return;
        }
        res.status(200).json({ success: true, data: orderItem });
    }
    catch (error) {
        console.error("Error in getOrderItemById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createOrderItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!mongoose_1.default.Types.ObjectId.isValid(order_id)) {
            res.status(400).json({ success: false, error: "Invalid order_id" });
            return;
        }
        const order = yield Order_1.default.findById(order_id);
        if (!order) {
            res.status(404).json({ success: false, error: "Order not found" });
            return;
        }
        // Validate item_id
        if (!mongoose_1.default.Types.ObjectId.isValid(item_id)) {
            res.status(400).json({ success: false, error: "Invalid item_id" });
            return;
        }
        const item = yield Item_1.default.findById(item_id);
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
        if (item.itemStatus !== statusEnums_1.ItemStatus.Available) {
            res.status(400).json({
                success: false,
                error: `Item ${item_id} is not available (status: ${item.itemStatus}). Only items with status '${statusEnums_1.ItemStatus.Available}' can be ordered.`,
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
        const newOrderItem = new OrderItem_1.default({
            order_id,
            item_id,
            quantity: orderQuantity,
            price: finalPrice, // Store price at time of order
            is_returned: is_returned || false,
        });
        const savedOrderItem = yield newOrderItem.save();
        // Add order item ID to order's orderitem_ids array
        if (!order.orderitem_ids) {
            order.orderitem_ids = [];
        }
        order.orderitem_ids.push(savedOrderItem._id);
        yield order.save();
        // Link item to order
        yield Item_1.default.findByIdAndUpdate(item_id, { orderId: order_id });
        res.status(201).json({
            success: true,
            message: "Order item created successfully",
            data: savedOrderItem,
        });
    }
    catch (error) {
        console.error("Error in createOrderItem:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: errors,
            });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const updateOrderItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderItemId = req.params.id;
        const updateData = Object.assign({}, req.body);
        if (!mongoose_1.default.Types.ObjectId.isValid(orderItemId)) {
            res.status(400).json({ success: false, error: "Invalid order item ID" });
            return;
        }
        const existingOrderItem = yield OrderItem_1.default.findById(orderItemId);
        if (!existingOrderItem) {
            res.status(404).json({ success: false, error: "Order item not found" });
            return;
        }
        // Validate order_id if provided
        if (updateData.order_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(updateData.order_id)) {
                res.status(400).json({ success: false, error: "Invalid order_id" });
                return;
            }
            const order = yield Order_1.default.findById(updateData.order_id);
            if (!order) {
                res.status(404).json({ success: false, error: "Order not found" });
                return;
            }
        }
        // Validate item_id if provided
        if (updateData.item_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(updateData.item_id)) {
                res.status(400).json({ success: false, error: "Invalid item_id" });
                return;
            }
            const item = yield Item_1.default.findById(updateData.item_id);
            if (!item) {
                res.status(404).json({ success: false, error: "Item not found" });
                return;
            }
        }
        const updatedOrderItem = yield OrderItem_1.default.findByIdAndUpdate(orderItemId, updateData, { new: true, runValidators: true });
        if (!updatedOrderItem) {
            res.status(404).json({ success: false, error: "Order item not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Order item updated successfully",
            data: updatedOrderItem,
        });
    }
    catch (error) {
        console.error("Error in updateOrderItem:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: errors,
            });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const deleteOrderItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderItemId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderItemId)) {
            res.status(400).json({ success: false, error: "Invalid order item ID" });
            return;
        }
        const orderItem = yield OrderItem_1.default.findById(orderItemId);
        if (!orderItem) {
            res.status(404).json({ success: false, error: "Order item not found" });
            return;
        }
        // Remove order item ID from order's orderitem_ids array
        yield Order_1.default.updateMany({ orderitem_ids: orderItemId }, { $pull: { orderitem_ids: orderItemId } });
        // Delete order item
        yield OrderItem_1.default.findByIdAndDelete(orderItemId);
        res.status(200).json({
            success: true,
            message: "Order item deleted successfully",
            data: { id: orderItemId },
        });
    }
    catch (error) {
        console.error("Error in deleteOrderItem:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const markOrderItemReturned = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderItemId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderItemId)) {
            res.status(400).json({ success: false, error: "Invalid order item ID" });
            return;
        }
        const orderItem = yield OrderItem_1.default.findById(orderItemId);
        if (!orderItem) {
            res.status(404).json({ success: false, error: "Order item not found" });
            return;
        }
        const updatedOrderItem = yield OrderItem_1.default.findByIdAndUpdate(orderItemId, { is_returned: true }, { new: true });
        res.status(200).json({
            success: true,
            message: "Order item marked as returned",
            data: updatedOrderItem,
        });
    }
    catch (error) {
        console.error("Error in markOrderItemReturned:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getOrderItems,
    getOrderItemsByOrderId,
    getOrderItemById,
    createOrderItem,
    updateOrderItem,
    deleteOrderItem,
    markOrderItemReturned,
};
