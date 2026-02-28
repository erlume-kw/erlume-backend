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
const Item_1 = __importDefault(require("../models/Item"));
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
            .populate("item_id")
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
const recalculateSaleCommissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const sales = yield Sale_1.default.find({})
            .select("_id amount item_id order_item_id")
            .lean();
        const orderItemCache = new Map();
        const itemCache = new Map();
        const bulkOps = [];
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
                    itemId = (_a = orderItemCache.get(orderItemId)) !== null && _a !== void 0 ? _a : undefined;
                }
                else {
                    const orderItem = yield OrderItem_1.default.findById(orderItemId)
                        .select("item_id")
                        .lean();
                    const resolvedItemId = (orderItem === null || orderItem === void 0 ? void 0 : orderItem.item_id)
                        ? String(orderItem.item_id)
                        : null;
                    orderItemCache.set(orderItemId, resolvedItemId);
                    itemId = resolvedItemId !== null && resolvedItemId !== void 0 ? resolvedItemId : undefined;
                }
            }
            if (!itemId) {
                skippedCount += 1;
                continue;
            }
            let saleRateValue;
            if (itemCache.has(itemId)) {
                saleRateValue = (_b = itemCache.get(itemId)) !== null && _b !== void 0 ? _b : undefined;
            }
            else {
                const item = yield Item_1.default.findById(itemId).select("saleRate").lean();
                saleRateValue = (_c = item === null || item === void 0 ? void 0 : item.saleRate) !== null && _c !== void 0 ? _c : null;
                itemCache.set(itemId, saleRateValue);
            }
            const rate = normalizeSaleRate(saleRateValue);
            const amountValue = Number(sale.amount);
            if (Number.isNaN(amountValue)) {
                skippedCount += 1;
                continue;
            }
            const erlumeCommission = (amountValue * rate).toFixed(2);
            const sellerPayout = (amountValue * (1 - rate)).toFixed(2);
            bulkOps.push({
                updateOne: {
                    filter: { _id: sale._id },
                    update: { $set: { erlumeCommission, sellerPayout } },
                },
            });
            updatedCount += 1;
        }
        if (bulkOps.length > 0) {
            yield Sale_1.default.bulkWrite(bulkOps);
        }
        res.status(200).json({
            success: true,
            message: "Sale commissions recalculated",
            data: { updatedCount, skippedCount, total: sales.length },
        });
    }
    catch (error) {
        console.error("Error in recalculateSaleCommissions:", error);
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
            .populate("item_id")
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
            .populate("item_id")
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
        const { order_id, order_item_id, item_id, transaction_id, amount, listingPrice, erlumeCommission, sellerPayout, buyer, status, sale_date, bag_record, invoice_number, invoice_url, payment_evidence_url, } = req.body;
        const hasOrderFlow = order_id && order_item_id;
        const hasPrelaunchFlow = amount != null || buyer || bag_record;
        if (!hasOrderFlow && !hasPrelaunchFlow) {
            res.status(400).json({
                success: false,
                error: "Provide order_id+order_item_id (order flow) or amount/buyer/bag_record (prelaunch flow)",
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
        let orderItem = null;
        if (order_item_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(order_item_id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid order_item_id",
                });
                return;
            }
            orderItem = yield OrderItem_1.default.findById(order_item_id);
            if (!orderItem) {
                res.status(404).json({ success: false, error: "Order item not found" });
                return;
            }
        }
        let itemIdToUse = item_id;
        if (!itemIdToUse && orderItem) {
            itemIdToUse = String(orderItem.item_id);
        }
        if (itemIdToUse) {
            if (!mongoose_1.default.Types.ObjectId.isValid(itemIdToUse)) {
                res.status(400).json({ success: false, error: "Invalid item_id" });
                return;
            }
            const item = yield Item_1.default.findById(itemIdToUse);
            if (!item) {
                res.status(404).json({ success: false, error: "Item not found" });
                return;
            }
            req.body._resolvedSaleRate = item.saleRate;
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
                res.status(404).json({ success: false, error: "Transaction not found" });
                return;
            }
        }
        const resolvedAmount = amount != null && amount !== "" ? Number(amount) : null;
        const safeSaleRate = normalizeSaleRate(req.body._resolvedSaleRate);
        const computedErlumeCommission = resolvedAmount != null
            ? (resolvedAmount * safeSaleRate).toFixed(2)
            : undefined;
        const computedSellerPayout = resolvedAmount != null
            ? (resolvedAmount * (1 - safeSaleRate)).toFixed(2)
            : undefined;
        const newSale = new Sale_1.default({
            order_id: order_id || undefined,
            order_item_id: order_item_id || undefined,
            item_id: item_id || undefined,
            transaction_id: transaction_id || undefined,
            amount,
            listingPrice,
            erlumeCommission: computedErlumeCommission !== null && computedErlumeCommission !== void 0 ? computedErlumeCommission : erlumeCommission,
            sellerPayout: computedSellerPayout !== null && computedSellerPayout !== void 0 ? computedSellerPayout : sellerPayout,
            buyer,
            status,
            sale_date: sale_date ? new Date(sale_date) : undefined,
            bag_record,
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
        const { transaction_id, amount, listingPrice, erlumeCommission, sellerPayout, buyer, status, sale_date, bag_record, invoice_number, invoice_url, payment_evidence_url, } = req.body;
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
        let computedErlumeCommission;
        let computedSellerPayout;
        let saleRateForCalc;
        if (sale.item_id) {
            const item = yield Item_1.default.findById(sale.item_id);
            if (item) {
                saleRateForCalc = normalizeSaleRate(item.saleRate);
            }
        }
        if (amount !== undefined) {
            update.amount = amount;
            if (amount !== null && amount !== "") {
                const numericAmount = Number(amount);
                if (!Number.isNaN(numericAmount)) {
                    const rate = saleRateForCalc !== null && saleRateForCalc !== void 0 ? saleRateForCalc : 0;
                    computedErlumeCommission = (numericAmount * rate).toFixed(2);
                    computedSellerPayout = (numericAmount * (1 - rate)).toFixed(2);
                }
            }
        }
        if (listingPrice !== undefined)
            update.listingPrice = listingPrice;
        if (computedErlumeCommission !== undefined) {
            update.erlumeCommission = computedErlumeCommission;
        }
        else if (erlumeCommission !== undefined) {
            update.erlumeCommission = erlumeCommission;
        }
        if (computedSellerPayout !== undefined) {
            update.sellerPayout = computedSellerPayout;
        }
        else if (sellerPayout !== undefined) {
            update.sellerPayout = sellerPayout;
        }
        if (buyer !== undefined)
            update.buyer = buyer;
        if (status !== undefined)
            update.status = status;
        if (sale_date !== undefined)
            update.sale_date =
                sale_date == null || sale_date === "" ? undefined : new Date(sale_date);
        if (bag_record !== undefined)
            update.bag_record = bag_record;
        const updatedSale = yield Sale_1.default.findByIdAndUpdate(saleId, { $set: update }, { new: true, runValidators: true })
            .populate("order_id")
            .populate("order_item_id")
            .populate("item_id")
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
    recalculateSaleCommissions,
};
