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
const Sale_1 = __importDefault(require("../models/Sale"));
const Order_1 = __importDefault(require("../models/Order"));
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const dateRange_1 = require("../utils/dateRange");
const getSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const sales = yield Sale_1.default.find(filter)
            .populate("order_id")
            .populate("order_item_id")
            .populate("transaction_id")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: sales,
            count: sales.length,
        });
    }
    catch (error) {
        console.error("Error in getSales:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getSalesByOrderId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const sales = yield Sale_1.default.find(filter)
            .populate("order_id")
            .populate("order_item_id")
            .populate("transaction_id")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: sales,
            count: sales.length,
        });
    }
    catch (error) {
        console.error("Error in getSalesByOrderId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getSaleById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const saleId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(saleId)) {
            res.status(400).json({ success: false, error: "Invalid sale ID" });
            return;
        }
        const sale = yield Sale_1.default.findById(saleId)
            .populate("order_id")
            .populate("order_item_id")
            .populate("transaction_id");
        if (!sale) {
            res.status(404).json({ success: false, error: "Sale not found" });
            return;
        }
        res.status(200).json({ success: true, data: sale });
    }
    catch (error) {
        console.error("Error in getSaleById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id, order_item_id, transaction_id, invoice_number, invoice_url, payment_evidence_url, } = req.body;
        if (!order_id || !order_item_id) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: order_id, order_item_id",
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(order_id)) {
            res.status(400).json({ success: false, error: "Invalid order_id" });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(order_item_id)) {
            res.status(400).json({ success: false, error: "Invalid order_item_id" });
            return;
        }
        const [order, orderItem] = yield Promise.all([
            Order_1.default.findById(order_id),
            OrderItem_1.default.findById(order_item_id),
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
            if (!mongoose_1.default.Types.ObjectId.isValid(transaction_id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid transaction_id",
                });
                return;
            }
            const transaction = yield Transaction_1.default.findById(transaction_id);
            if (!transaction) {
                res.status(404).json({
                    success: false,
                    error: "Transaction not found",
                });
                return;
            }
        }
        const newSale = new Sale_1.default({
            order_id,
            order_item_id,
            transaction_id: transaction_id || undefined,
            invoice_number,
            invoice_url,
            payment_evidence_url,
        });
        const savedSale = yield newSale.save();
        res.status(201).json({
            success: true,
            message: "Sale created successfully",
            data: savedSale,
        });
    }
    catch (error) {
        console.error("Error in createSale:", error);
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
const updateSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const saleId = req.params.id;
        const { transaction_id, invoice_number, invoice_url, payment_evidence_url } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(saleId)) {
            res.status(400).json({ success: false, error: "Invalid sale ID" });
            return;
        }
        const sale = yield Sale_1.default.findById(saleId);
        if (!sale) {
            res.status(404).json({ success: false, error: "Sale not found" });
            return;
        }
        const update = {};
        if (transaction_id !== undefined) {
            if (transaction_id === null || transaction_id === "") {
                update.transaction_id = null;
            }
            else {
                if (!mongoose_1.default.Types.ObjectId.isValid(transaction_id)) {
                    res.status(400).json({
                        success: false,
                        error: "Invalid transaction_id",
                    });
                    return;
                }
                const transaction = yield Transaction_1.default.findById(transaction_id);
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
        const updatedSale = yield Sale_1.default.findByIdAndUpdate(saleId, { $set: update }, { new: true, runValidators: true })
            .populate("order_id")
            .populate("order_item_id")
            .populate("transaction_id");
        res.status(200).json({
            success: true,
            message: "Sale updated successfully",
            data: updatedSale,
        });
    }
    catch (error) {
        console.error("Error in updateSale:", error);
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
const deleteSale = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const saleId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(saleId)) {
            res.status(400).json({ success: false, error: "Invalid sale ID" });
            return;
        }
        const sale = yield Sale_1.default.findById(saleId);
        if (!sale) {
            res.status(404).json({ success: false, error: "Sale not found" });
            return;
        }
        yield Sale_1.default.findByIdAndDelete(saleId);
        res.status(200).json({
            success: true,
            message: "Sale deleted successfully",
            data: { id: saleId },
        });
    }
    catch (error) {
        console.error("Error in deleteSale:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getSales,
    getSalesByOrderId,
    getSaleById,
    createSale,
    updateSale,
    deleteSale,
};
