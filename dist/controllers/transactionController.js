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
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Order_1 = __importDefault(require("../models/Order"));
const DiscountCode_1 = __importDefault(require("../models/DiscountCode"));
const mongoose_1 = __importDefault(require("mongoose"));
const transactionEnums_1 = require("../enums/transactionEnums");
const paymentEnums_1 = require("../enums/paymentEnums");
const dateRange_1 = require("../utils/dateRange");
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year, month } = req.query;
        const filter = {};
        const { range, error } = (0, dateRange_1.getMonthYearDateRange)(year, month);
        if (error) {
            res.status(400).json({ success: false, error });
            return;
        }
        if (range) {
            filter.createdAt = range;
        }
        const transactions = yield Transaction_1.default.find(filter)
            .populate("order_id")
            .populate("discount_id");
        res.status(200).json({
            success: true,
            data: transactions,
            count: transactions.length,
        });
    }
    catch (error) {
        console.error("Error in getTransactions:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getTransactionsByOrderId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderId = req.params.orderId;
        const { year, month } = req.query;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            res.status(400).json({ success: false, error: "Invalid order ID" });
            return;
        }
        const order = yield Order_1.default.findById(orderId);
        if (!order) {
            res.status(404).json({ success: false, error: "Order not found" });
            return;
        }
        const filter = { order_id: orderId };
        const { range, error } = (0, dateRange_1.getMonthYearDateRange)(year, month);
        if (error) {
            res.status(400).json({ success: false, error });
            return;
        }
        if (range) {
            filter.createdAt = range;
        }
        const transactions = yield Transaction_1.default.find(filter)
            .populate("order_id")
            .populate("discount_id");
        res.status(200).json({
            success: true,
            data: transactions,
            count: transactions.length,
        });
    }
    catch (error) {
        console.error("Error in getTransactionsByOrderId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getTransactionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(transactionId)) {
            res.status(400).json({ success: false, error: "Invalid transaction ID" });
            return;
        }
        const transaction = yield Transaction_1.default.findById(transactionId)
            .populate("order_id")
            .populate("discount_id");
        if (!transaction) {
            res.status(404).json({ success: false, error: "Transaction not found" });
            return;
        }
        res.status(200).json({ success: true, data: transaction });
    }
    catch (error) {
        console.error("Error in getTransactionById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id, discount_rate, amount, discount_id, paymentMethod } = req.body;
        // Validate required fields
        if (!order_id || !discount_rate || !amount) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: order_id, discount_rate, amount",
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
        // Check if transaction already exists for this order
        const existingTransaction = yield Transaction_1.default.findOne({ order_id });
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
            if (!mongoose_1.default.Types.ObjectId.isValid(discount_id)) {
                res.status(400).json({ success: false, error: "Invalid discount_id" });
                return;
            }
            const discount = yield DiscountCode_1.default.findById(discount_id);
            if (!discount) {
                res.status(404).json({
                    success: false,
                    error: "Discount code not found",
                });
                return;
            }
        }
        // Validate paymentMethod if provided
        if (paymentMethod && !Object.values(paymentEnums_1.PaymentMethod).includes(paymentMethod)) {
            res.status(400).json({
                success: false,
                error: `Invalid paymentMethod. Must be one of: ${Object.values(paymentEnums_1.PaymentMethod).join(", ")}`,
            });
            return;
        }
        // Create transaction
        const newTransaction = new Transaction_1.default({
            order_id,
            discount_rate,
            amount,
            discount_id,
            status: transactionEnums_1.TransactionStatus.Pending, // Default status
            paymentMethod: paymentMethod || undefined, // Optional payment method
        });
        const savedTransaction = yield newTransaction.save();
        res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            data: savedTransaction,
        });
    }
    catch (error) {
        console.error("Error in createTransaction:", error);
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
const updateTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionId = req.params.id;
        const { discount_rate, amount, discount_id, status, paymentMethod } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(transactionId)) {
            res.status(400).json({ success: false, error: "Invalid transaction ID" });
            return;
        }
        const transaction = yield Transaction_1.default.findById(transactionId);
        if (!transaction) {
            res.status(404).json({ success: false, error: "Transaction not found" });
            return;
        }
        // Build update object - only update fields that are provided
        const update = {};
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
            }
            else {
                if (!mongoose_1.default.Types.ObjectId.isValid(discount_id)) {
                    res.status(400).json({
                        success: false,
                        error: "Invalid discount_id",
                    });
                    return;
                }
                const discount = yield DiscountCode_1.default.findById(discount_id);
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
            if (!Object.values(transactionEnums_1.TransactionStatus).includes(status)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${Object.values(transactionEnums_1.TransactionStatus).join(", ")}`,
                });
                return;
            }
            update.status = status;
        }
        if (paymentMethod !== undefined) {
            if (paymentMethod === null || paymentMethod === "") {
                // Allow clearing the paymentMethod
                update.paymentMethod = null;
            }
            else {
                if (!Object.values(paymentEnums_1.PaymentMethod).includes(paymentMethod)) {
                    res.status(400).json({
                        success: false,
                        error: `Invalid paymentMethod. Must be one of: ${Object.values(paymentEnums_1.PaymentMethod).join(", ")}`,
                    });
                    return;
                }
                update.paymentMethod = paymentMethod;
            }
        }
        // Update transaction
        const updatedTransaction = yield Transaction_1.default.findByIdAndUpdate(transactionId, { $set: update }, { new: true, runValidators: true })
            .populate("order_id")
            .populate("discount_id");
        res.status(200).json({
            success: true,
            message: "Transaction updated successfully",
            data: updatedTransaction,
        });
    }
    catch (error) {
        console.error("Error in updateTransaction:", error);
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
const updateTransactionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionId = req.params.id;
        const { status } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(transactionId)) {
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
        if (!Object.values(transactionEnums_1.TransactionStatus).includes(status)) {
            res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${Object.values(transactionEnums_1.TransactionStatus).join(", ")}`,
            });
            return;
        }
        const transaction = yield Transaction_1.default.findById(transactionId);
        if (!transaction) {
            res.status(404).json({ success: false, error: "Transaction not found" });
            return;
        }
        const updatedTransaction = yield Transaction_1.default.findByIdAndUpdate(transactionId, { status }, { new: true, runValidators: true })
            .populate("order_id")
            .populate("discount_id");
        res.status(200).json({
            success: true,
            message: "Transaction status updated successfully",
            data: updatedTransaction,
        });
    }
    catch (error) {
        console.error("Error in updateTransactionStatus:", error);
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
const deleteTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactionId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(transactionId)) {
            res.status(400).json({ success: false, error: "Invalid transaction ID" });
            return;
        }
        const transaction = yield Transaction_1.default.findById(transactionId);
        if (!transaction) {
            res.status(404).json({ success: false, error: "Transaction not found" });
            return;
        }
        yield Transaction_1.default.findByIdAndDelete(transactionId);
        res.status(200).json({
            success: true,
            message: "Transaction deleted successfully",
            data: { id: transactionId },
        });
    }
    catch (error) {
        console.error("Error in deleteTransaction:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getTransactions,
    getTransactionsByOrderId,
    getTransactionById,
    createTransaction,
    updateTransaction,
    updateTransactionStatus,
    deleteTransaction,
};
