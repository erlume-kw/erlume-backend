"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const OrderItem_1 = __importDefault(require("../models/OrderItem"));
const Item_1 = __importDefault(require("../models/Item"));
const User_1 = __importDefault(require("../models/User"));
const DiscountCode_1 = __importDefault(require("../models/DiscountCode"));
const mongoose_1 = __importDefault(require("mongoose"));
const transactionEnums_1 = require("../enums/transactionEnums");
const paymentEnums_1 = require("../enums/paymentEnums");
const dateRange_1 = require("../utils/dateRange");
const zohoInvoice_1 = require("../utils/zohoInvoice");
const notifications_1 = require("../utils/notifications");
// ─── Helper: build and send Zoho invoice for an order ────────────────────────
const isKnown = (v) => v && v.toLowerCase() !== "unknown";
function fireZohoInvoice(orderId, discountedAmount, discountRate) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            const order = yield Order_1.default.findById(orderId);
            if (!order)
                return;
            // Resolve customer contact info
            let notifPhone;
            let notifEmail;
            let customerName;
            if (order.user_id) {
                const user = yield User_1.default.findById(order.user_id);
                notifPhone = user === null || user === void 0 ? void 0 : user.phoneNumber;
                notifEmail = user === null || user === void 0 ? void 0 : user.emailAddress;
                customerName = (_b = (_a = user === null || user === void 0 ? void 0 : user.emailAddress) !== null && _a !== void 0 ? _a : notifPhone) !== null && _b !== void 0 ? _b : "Customer";
            }
            else {
                const g = order.guestInfo;
                notifPhone = g === null || g === void 0 ? void 0 : g.phoneNumber;
                notifEmail = g === null || g === void 0 ? void 0 : g.emailAddress;
                customerName = (_d = (_c = g === null || g === void 0 ? void 0 : g.name) !== null && _c !== void 0 ? _c : g === null || g === void 0 ? void 0 : g.phoneNumber) !== null && _d !== void 0 ? _d : "Guest";
            }
            // Build line items from DB
            const orderItems = yield OrderItem_1.default.find({ order_id: orderId }).lean();
            const zohoLineItems = [];
            const itemSummaries = [];
            let fullTotal = 0;
            for (const oi of orderItems) {
                const item = yield Item_1.default.findById(oi.item_id).lean();
                if (!item)
                    continue;
                const qty = Number(oi.quantity) || 1;
                const rate = parseFloat(item.listingPrice);
                fullTotal += rate * qty;
                const parts = [
                    `${item.brandName} — ${item.itemName}`,
                    isKnown(item.color) ? item.color : null,
                    isKnown(item.size) ? `Size: ${item.size}` : null,
                ].filter(Boolean);
                zohoLineItems.push({ name: parts.join(" · "), quantity: qty, rate });
                itemSummaries.push({
                    itemName: item.itemName,
                    brandName: item.brandName,
                    quantity: qty,
                    price: rate.toFixed(2),
                });
            }
            const zohoResult = yield (0, zohoInvoice_1.createZohoInvoice)({
                orderId,
                customerName,
                phoneNumber: notifPhone !== null && notifPhone !== void 0 ? notifPhone : "",
                email: notifEmail || undefined,
                items: zohoLineItems,
                totalAmount: discountedAmount,
                discountRate: discountRate > 0 ? discountRate : undefined,
            });
            // Send one combined WhatsApp: order confirmation + discount breakdown + invoice link
            if (notifPhone) {
                yield (0, notifications_1.sendOrderConfirmation)(Object.assign(Object.assign({ emailAddress: notifEmail !== null && notifEmail !== void 0 ? notifEmail : "", phoneNumber: notifPhone, orderId, items: itemSummaries, totalAmount: fullTotal.toFixed(2) }, (discountRate > 0 ? {
                    discountRate,
                    discountedTotal: discountedAmount.toFixed(2),
                } : {})), { invoiceUrl: zohoResult === null || zohoResult === void 0 ? void 0 : zohoResult.invoiceUrl }));
            }
            // Notify Erlume team
            try {
                const { Resend } = yield Promise.resolve().then(() => __importStar(require("resend")));
                const resend = new Resend(process.env.RESEND_API_KEY);
                const itemRows = itemSummaries.map(i => `<tr>
					<td style="padding:6px 0;border-bottom:1px solid #eee;">${i.brandName} — ${i.itemName}</td>
					<td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">KD ${i.price}</td>
				</tr>`).join("");
                const total = discountRate > 0
                    ? `<s style="color:#999;">KD ${fullTotal.toFixed(2)}</s> → <strong>KD ${discountedAmount.toFixed(2)}</strong> (${discountRate}% off)`
                    : `<strong>KD ${fullTotal.toFixed(2)}</strong>`;
                yield resend.emails.send({
                    from: (_e = process.env.RESEND_FROM) !== null && _e !== void 0 ? _e : "orders@erlume.com.kw",
                    to: ["info@erlume.com.kw"],
                    subject: `New Order — ${customerName} · #${orderId.slice(-8).toUpperCase()}`,
                    html: `
					<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
						<h2 style="color:#111d11;margin:0 0 4px;">New Order Received</h2>
						<p style="margin:0 0 24px;color:#888;font-size:13px;">Order #${orderId.slice(-8).toUpperCase()}</p>
						<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
							<tr><td style="padding:6px 0;color:#666;width:130px;">Customer</td><td style="padding:6px 0;font-weight:600;">${customerName}</td></tr>
							${notifPhone ? `<tr><td style="padding:6px 0;color:#666;">Phone</td><td style="padding:6px 0;">${notifPhone}</td></tr>` : ""}
							${notifEmail ? `<tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;">${notifEmail}</td></tr>` : ""}
						</table>
						<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
							${itemRows}
							<tr>
								<td style="padding:10px 0;font-weight:600;">Total</td>
								<td style="padding:10px 0;text-align:right;">${total}</td>
							</tr>
						</table>
						${(zohoResult === null || zohoResult === void 0 ? void 0 : zohoResult.invoiceNumber) ? `<p style="margin:0 0 16px;font-size:14px;color:#444;">Invoice: <strong>${zohoResult.invoiceNumber}</strong></p>` : ""}
						${(zohoResult === null || zohoResult === void 0 ? void 0 : zohoResult.invoiceId) ? `<a href="https://invoice.zoho.com/app/${process.env.ZOHO_ORG_ID}/invoices/${zohoResult.invoiceId}" style="background:#111d11;color:#fff;padding:11px 24px;border-radius:5px;text-decoration:none;font-size:13px;">Open in Zoho Invoice</a>` : ""}
						<p style="margin-top:24px;font-size:11px;color:#bbb;">${new Date().toLocaleString("en-KW", { timeZone: "Asia/Kuwait" })}</p>
					</div>`,
                });
            }
            catch (emailErr) {
                console.error("[transactionController] Team notification email failed:", emailErr);
            }
        }
        catch (err) {
            console.error("[transactionController] Zoho invoice error:", err);
        }
    });
}
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
        // If a transaction already exists, update it with the new discount/amount and create invoice
        const existingTransaction = yield Transaction_1.default.findOne({ order_id });
        if (existingTransaction) {
            const update = {};
            if (discount_rate !== undefined)
                update.discount_rate = discount_rate;
            if (amount !== undefined)
                update.amount = amount;
            if (discount_id !== undefined)
                update.discount_id = discount_id || null;
            if (paymentMethod !== undefined)
                update.paymentMethod = paymentMethod || null;
            const updatedTransaction = yield Transaction_1.default.findByIdAndUpdate(existingTransaction._id, { $set: update }, { new: true }).populate("order_id").populate("discount_id");
            // Fire Zoho invoice with the correct (discounted) amount
            void fireZohoInvoice(String(order_id), parseFloat(amount) || 0, parseFloat(discount_rate) || 0);
            res.status(200).json({
                success: true,
                message: "Transaction updated with discount and invoice queued",
                data: updatedTransaction,
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
        // Fire Zoho invoice
        void fireZohoInvoice(String(order_id), parseFloat(amount) || 0, parseFloat(discount_rate) || 0);
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
