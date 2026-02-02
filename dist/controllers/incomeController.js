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
const mongoose_1 = __importDefault(require("mongoose"));
const Income_1 = __importDefault(require("../models/Income"));
const Order_1 = __importDefault(require("../models/Order"));
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const Item_1 = __importDefault(require("../models/Item"));
const User_1 = __importDefault(require("../models/User"));
const dateRange_1 = require("../utils/dateRange");
const getIncomes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, itemId, sellerId, year, month } = req.query;
        const filter = {};
        const { range, error } = (0, dateRange_1.getMonthYearDateRange)(year, month);
        if (error) {
            res.status(400).json({ success: false, error });
            return;
        }
        if (range) {
            filter.received_at = range;
        }
        if (orderId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
                res.status(400).json({ success: false, error: "Invalid orderId" });
                return;
            }
            filter.order_id = orderId;
        }
        if (itemId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
                res.status(400).json({ success: false, error: "Invalid itemId" });
                return;
            }
            filter.item_id = itemId;
        }
        if (sellerId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(sellerId)) {
                res.status(400).json({ success: false, error: "Invalid sellerId" });
                return;
            }
            filter.seller_id = sellerId;
        }
        const incomes = yield Income_1.default.find(filter)
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
    }
    catch (error) {
        console.error("Error in getIncomes:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getIncomeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const incomeId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(incomeId)) {
            res.status(400).json({ success: false, error: "Invalid income ID" });
            return;
        }
        const income = yield Income_1.default.findById(incomeId)
            .populate("order_id")
            .populate("order_item_id")
            .populate("item_id")
            .populate("seller_id");
        if (!income) {
            res.status(404).json({ success: false, error: "Income not found" });
            return;
        }
        res.status(200).json({ success: true, data: income });
    }
    catch (error) {
        console.error("Error in getIncomeById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id, order_item_id, item_id, seller_id, amount, erlumeCommissionAmount, sellerPayoutAmount, currency, platform, income_type, received_at, notes, } = req.body;
        if (!amount) {
            res.status(400).json({
                success: false,
                error: "Missing required field: amount",
            });
            return;
        }
        if (order_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(order_id)) {
                res.status(400).json({ success: false, error: "Invalid order_id" });
                return;
            }
            const order = yield Order_1.default.findById(order_id);
            if (!order) {
                res.status(404).json({ success: false, error: "Order not found" });
                return;
            }
        }
        if (order_item_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(order_item_id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid order_item_id",
                });
                return;
            }
            const orderItem = yield OrderItem_1.default.findById(order_item_id);
            if (!orderItem) {
                res.status(404).json({
                    success: false,
                    error: "OrderItem not found",
                });
                return;
            }
        }
        if (item_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(item_id)) {
                res.status(400).json({ success: false, error: "Invalid item_id" });
                return;
            }
            const item = yield Item_1.default.findById(item_id);
            if (!item) {
                res.status(404).json({ success: false, error: "Item not found" });
                return;
            }
        }
        if (seller_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(seller_id)) {
                res.status(400).json({ success: false, error: "Invalid seller_id" });
                return;
            }
            const seller = yield User_1.default.findById(seller_id);
            if (!seller) {
                res.status(404).json({ success: false, error: "Seller not found" });
                return;
            }
        }
        const newIncome = new Income_1.default({
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
        const savedIncome = yield newIncome.save();
        res.status(201).json({
            success: true,
            message: "Income created successfully",
            data: savedIncome,
        });
    }
    catch (error) {
        console.error("Error in createIncome:", error);
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
const updateIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const incomeId = req.params.id;
        const update = Object.assign({}, req.body);
        if (!mongoose_1.default.Types.ObjectId.isValid(incomeId)) {
            res.status(400).json({ success: false, error: "Invalid income ID" });
            return;
        }
        const income = yield Income_1.default.findById(incomeId);
        if (!income) {
            res.status(404).json({ success: false, error: "Income not found" });
            return;
        }
        if (update.order_id !== undefined) {
            if (update.order_id === null || update.order_id === "") {
                update.order_id = undefined;
            }
            else if (!mongoose_1.default.Types.ObjectId.isValid(update.order_id)) {
                res.status(400).json({ success: false, error: "Invalid order_id" });
                return;
            }
            else {
                const order = yield Order_1.default.findById(update.order_id);
                if (!order) {
                    res.status(404).json({ success: false, error: "Order not found" });
                    return;
                }
            }
        }
        if (update.order_item_id !== undefined) {
            if (update.order_item_id === null || update.order_item_id === "") {
                update.order_item_id = undefined;
            }
            else if (!mongoose_1.default.Types.ObjectId.isValid(update.order_item_id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid order_item_id",
                });
                return;
            }
            else {
                const orderItem = yield OrderItem_1.default.findById(update.order_item_id);
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
            }
            else if (!mongoose_1.default.Types.ObjectId.isValid(update.item_id)) {
                res.status(400).json({ success: false, error: "Invalid item_id" });
                return;
            }
            else {
                const item = yield Item_1.default.findById(update.item_id);
                if (!item) {
                    res.status(404).json({ success: false, error: "Item not found" });
                    return;
                }
            }
        }
        if (update.seller_id !== undefined) {
            if (update.seller_id === null || update.seller_id === "") {
                update.seller_id = undefined;
            }
            else if (!mongoose_1.default.Types.ObjectId.isValid(update.seller_id)) {
                res.status(400).json({ success: false, error: "Invalid seller_id" });
                return;
            }
            else {
                const seller = yield User_1.default.findById(update.seller_id);
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
        const updatedIncome = yield Income_1.default.findByIdAndUpdate(incomeId, { $set: update }, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: "Income updated successfully",
            data: updatedIncome,
        });
    }
    catch (error) {
        console.error("Error in updateIncome:", error);
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
const deleteIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const incomeId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(incomeId)) {
            res.status(400).json({ success: false, error: "Invalid income ID" });
            return;
        }
        const income = yield Income_1.default.findById(incomeId);
        if (!income) {
            res.status(404).json({ success: false, error: "Income not found" });
            return;
        }
        yield Income_1.default.findByIdAndDelete(incomeId);
        res.status(200).json({
            success: true,
            message: "Income deleted successfully",
            data: { id: incomeId },
        });
    }
    catch (error) {
        console.error("Error in deleteIncome:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getIncomes,
    getIncomeById,
    createIncome,
    updateIncome,
    deleteIncome,
};
