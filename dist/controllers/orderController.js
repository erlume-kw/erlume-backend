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
const Order_1 = __importDefault(require("../models/Order"));
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const User_1 = __importDefault(require("../models/User"));
const Item_1 = __importDefault(require("../models/Item"));
const Income_1 = __importDefault(require("../models/Income"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Sale_1 = __importDefault(require("../models/Sale"));
const mongoose_1 = __importDefault(require("mongoose"));
const orderEnums_1 = require("../enums/orderEnums");
const transactionEnums_1 = require("../enums/transactionEnums");
const flowEnums_1 = require("../enums/flowEnums");
const dateRange_1 = require("../utils/dateRange");
const normalizeSaleRate = (value) => {
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
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, year, month } = req.query;
        const query = {};
        const { range, error } = (0, dateRange_1.getMonthYearDateRange)(year, month);
        if (error) {
            res.status(400).json({ success: false, error });
            return;
        }
        if (range) {
            query.createdAt = range;
        }
        if (status) {
            if (!Object.values(orderEnums_1.OrderStatus).includes(status)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${Object.values(orderEnums_1.OrderStatus).join(", ")}`,
                });
                return;
            }
            query.order_status = status;
        }
        const orders = yield Order_1.default.find(query)
            .populate("user_id")
            .populate("orderitem_ids")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: orders,
            count: orders.length,
        });
    }
    catch (error) {
        console.error("Error in getOrders:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getOrdersByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        const { year, month } = req.query;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({ success: false, error: "Invalid user ID" });
            return;
        }
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, error: "User not found" });
            return;
        }
        const query = { user_id: userId };
        const { range, error } = (0, dateRange_1.getMonthYearDateRange)(year, month);
        if (error) {
            res.status(400).json({ success: false, error });
            return;
        }
        if (range) {
            query.createdAt = range;
        }
        const orders = yield Order_1.default.find(query)
            .populate("user_id")
            .populate("orderitem_ids")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: orders,
            count: orders.length,
        });
    }
    catch (error) {
        console.error("Error in getOrdersByUserId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({ success: false, error: "Invalid order ID" });
            return;
        }
        const order = yield Order_1.default.findById(orderId)
            .populate("user_id")
            .populate("orderitem_ids");
        if (!order) {
            res.status(404).json({ success: false, error: "Order not found" });
            return;
        }
        res.status(200).json({ success: true, data: order });
    }
    catch (error) {
        console.error("Error in getOrderById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
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
        if (!mongoose_1.default.Types.ObjectId.isValid(user_id)) {
            res.status(400).json({ success: false, error: "Invalid user_id" });
            return;
        }
        const user = yield User_1.default.findById(user_id).session(session);
        if (!user) {
            res.status(404).json({ success: false, error: "User not found" });
            return;
        }
        // Validate order_status if provided
        if (order_status && !Object.values(orderEnums_1.OrderStatus).includes(order_status)) {
            res.status(400).json({
                success: false,
                error: `Invalid order_status. Must be one of: ${Object.values(orderEnums_1.OrderStatus).join(", ")}`,
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
        // Create order
        const newOrder = new Order_1.default({
            user_id,
            orderitem_ids: [],
            order_status: order_status || orderEnums_1.OrderStatus.Pending,
        });
        const savedOrder = yield newOrder.save({ session });
        const createdOrderItemIds = [];
        const itemIds = [];
        const incomeDocs = [];
        const saleDocs = [];
        let totalAmount = 0;
        for (const orderItemInput of orderItems) {
            const { item_id, quantity, is_returned } = orderItemInput !== null && orderItemInput !== void 0 ? orderItemInput : {};
            if (!item_id) {
                res.status(400).json({
                    success: false,
                    error: "Each order item must include item_id",
                });
                yield session.abortTransaction();
                return;
            }
            if (quantity !== undefined && (isNaN(quantity) || quantity < 1)) {
                res.status(400).json({
                    success: false,
                    error: "Quantity must be a number greater than 0",
                });
                yield session.abortTransaction();
                return;
            }
            if (!mongoose_1.default.Types.ObjectId.isValid(item_id)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid item_id: ${item_id}`,
                });
                yield session.abortTransaction();
                return;
            }
            const item = yield Item_1.default.findById(item_id).session(session);
            if (!item) {
                res.status(404).json({
                    success: false,
                    error: `Item not found: ${item_id}`,
                });
                yield session.abortTransaction();
                return;
            }
            const basePrice = parseFloat(item.basePrice);
            const saleRate = parseFloat(item.saleRate);
            const discountAmount = basePrice * saleRate;
            const finalPrice = (basePrice - discountAmount).toFixed(2);
            const orderQuantity = quantity || 1;
            const createdOrderItem = yield OrderItem_1.default.create([
                {
                    order_id: savedOrder._id,
                    item_id,
                    quantity: orderQuantity,
                    price: finalPrice,
                    is_returned: is_returned || false,
                },
            ], { session });
            createdOrderItemIds.push(createdOrderItem[0]._id);
            itemIds.push(item._id);
            const lineTotal = (parseFloat(finalPrice) * Number(orderQuantity)).toFixed(2);
            totalAmount += Number(lineTotal);
            incomeDocs.push({
                order_id: savedOrder._id,
                order_item_id: createdOrderItem[0]._id,
                item_id,
                seller_id: (_a = item.seller_id) !== null && _a !== void 0 ? _a : undefined,
                amount: lineTotal,
                received_at: new Date(),
            });
            const saleRateValue = normalizeSaleRate(saleRate);
            const erlumeCommission = (Number(lineTotal) * saleRateValue).toFixed(2);
            const sellerPayout = (Number(lineTotal) * (1 - saleRateValue)).toFixed(2);
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
        yield savedOrder.save({ session });
        if (itemIds.length > 0) {
            yield Item_1.default.updateMany({ _id: { $in: itemIds } }, { orderId: savedOrder._id }, { session });
        }
        if (incomeDocs.length > 0) {
            yield Income_1.default.insertMany(incomeDocs, { session });
        }
        const transaction = yield Transaction_1.default.create([
            {
                order_id: savedOrder._id,
                discount_rate: "0",
                amount: totalAmount.toFixed(2),
                status: transactionEnums_1.TransactionStatus.Pending,
            },
        ], { session });
        if (saleDocs.length > 0) {
            const saleDocsWithTransaction = saleDocs.map((doc) => (Object.assign(Object.assign({}, doc), { transaction_id: transaction[0]._id })));
            yield Sale_1.default.insertMany(saleDocsWithTransaction, { session });
        }
        yield session.commitTransaction();
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: savedOrder,
        });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Error in createOrder:", error);
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
    finally {
        session.endSession();
    }
});
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
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
        if (!Object.values(orderEnums_1.OrderStatus).includes(status)) {
            res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${Object.values(orderEnums_1.OrderStatus).join(", ")}`,
            });
            return;
        }
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, error: "Order not found" });
            return;
        }
        const updatedOrder = yield Order_1.default.findByIdAndUpdate(orderId, { order_status: status }, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: updatedOrder,
        });
    }
    catch (error) {
        console.error("Error in updateOrderStatus:", error);
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
/** Partial update: order_status, deliveryDate, deliveryStatus, trackingReference */
const updateOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.id;
        const body = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({ success: false, error: "Invalid order ID" });
            return;
        }
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, error: "Order not found" });
            return;
        }
        const update = {};
        if (body.order_status !== undefined) {
            if (!Object.values(orderEnums_1.OrderStatus).includes(body.order_status)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid order_status. Must be one of: ${Object.values(orderEnums_1.OrderStatus).join(", ")}`,
                });
                return;
            }
            update.order_status = body.order_status;
        }
        if (body.deliveryDate !== undefined) {
            update.deliveryDate =
                body.deliveryDate == null || body.deliveryDate === ""
                    ? undefined
                    : new Date(body.deliveryDate);
        }
        if (body.deliveryStatus !== undefined) {
            if (body.deliveryStatus != null &&
                body.deliveryStatus !== "" &&
                !Object.values(flowEnums_1.DeliveryStatus).includes(body.deliveryStatus)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid deliveryStatus. Must be one of: ${Object.values(flowEnums_1.DeliveryStatus).join(", ")}`,
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
        const updatedOrder = yield Order_1.default.findByIdAndUpdate(orderId, { $set: update }, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: "Order updated successfully",
            data: updatedOrder,
        });
    }
    catch (error) {
        console.error("Error in updateOrder:", error);
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
const deleteOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({ success: false, error: "Invalid order ID" });
            return;
        }
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, error: "Order not found" });
            return;
        }
        // Delete order (cascade delete will handle OrderItems)
        yield Order_1.default.findByIdAndDelete(orderId);
        res.status(200).json({
            success: true,
            message: "Order deleted successfully",
            data: { id: orderId },
        });
    }
    catch (error) {
        console.error("Error in deleteOrder:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getOrders,
    getOrdersByUserId,
    getOrderById,
    createOrder,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
};
