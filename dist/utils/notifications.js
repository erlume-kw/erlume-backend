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
exports.sendOrderStatusUpdate = exports.sendOrderConfirmation = void 0;
const twilio_1 = __importDefault(require("twilio"));
// ─── Client helpers ───────────────────────────────────────────────────────────
const normalizePhone = (phone) => {
    const cleaned = phone.replace(/[\s\-]/g, "");
    return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
};
const getTwilio = () => {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN)
        return null;
    return (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};
// ─── Transport ────────────────────────────────────────────────────────────────
const sendWhatsApp = (to, body) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV === "test")
        return;
    const client = getTwilio();
    const from = process.env.TWILIO_WHATSAPP_FROM;
    if (!client || !from)
        return;
    try {
        yield client.messages.create({
            from: `whatsapp:${from}`,
            to: `whatsapp:${normalizePhone(to)}`,
            body,
        });
    }
    catch (err) {
        console.error("[notifications] WhatsApp send failed:", err);
    }
});
// ─── Message templates ────────────────────────────────────────────────────────
const orderConfirmationText = (orderId, items, totalAmount) => {
    const shortId = orderId.slice(-8).toUpperCase();
    const itemLines = items
        .map((i) => `  • ${i.brandName} ${i.itemName} × ${i.quantity} — KWD ${i.price}`)
        .join("\n");
    return `Erlume — Order Confirmed ✅\nRef #${shortId}\n\n${itemLines}\n\nTotal: KWD ${totalAmount}\n\nWe'll keep you updated on your order.`;
};
const statusUpdateText = (orderId, status, trackingReference) => {
    var _a;
    const shortId = orderId.slice(-8).toUpperCase();
    const messages = {
        Processing: `Your Erlume order #${shortId} is being processed. 🛍️`,
        Shipped: trackingReference
            ? `Your Erlume order #${shortId} has shipped. 📦\nTracking: ${trackingReference}`
            : `Your Erlume order #${shortId} has shipped. 📦`,
        Delivered: `Your Erlume order #${shortId} has been delivered. 🎉\nThank you for shopping with Erlume!`,
        Cancelled: `Your Erlume order #${shortId} has been cancelled.\nContact us if you have any questions.`,
        Returned: `Your Erlume order #${shortId} return is being processed.`,
    };
    return (_a = messages[status]) !== null && _a !== void 0 ? _a : `Your Erlume order #${shortId} status updated: ${status}`;
};
// ─── Public API ───────────────────────────────────────────────────────────────
const sendOrderConfirmation = (params) => __awaiter(void 0, void 0, void 0, function* () {
    yield sendWhatsApp(params.phoneNumber, orderConfirmationText(params.orderId, params.items, params.totalAmount));
});
exports.sendOrderConfirmation = sendOrderConfirmation;
const sendOrderStatusUpdate = (params) => __awaiter(void 0, void 0, void 0, function* () {
    yield sendWhatsApp(params.phoneNumber, statusUpdateText(params.orderId, params.status, params.trackingReference));
});
exports.sendOrderStatusUpdate = sendOrderStatusUpdate;
