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
exports.sendSellerReturnNotification = exports.sendOTP = exports.sendOrderStatusUpdate = exports.sendOrderConfirmation = void 0;
const twilio_1 = __importDefault(require("twilio"));
// ─── Approved template Content SIDs ──────────────────────────────────────────
const TEMPLATES = {
    orderConfirmation: "HXfb59cf29722b2094b3a9f8c19f918060",
    orderShipped: "HXc301c6b004f8442710f5716b6310945b",
    orderDelivered: "HX5edf8644d51a5e75dff717568c009b02",
};
// ─── Client helpers ───────────────────────────────────────────────────────────
const SANDBOX_NUMBER = "+14155238886";
const normalizePhone = (phone) => {
    const cleaned = phone.replace(/[\s\-]/g, "");
    return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
};
const getTwilio = () => {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN)
        return null;
    return (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};
const isSandbox = () => { var _a; return ((_a = process.env.TWILIO_WHATSAPP_FROM) !== null && _a !== void 0 ? _a : "").trim() === SANDBOX_NUMBER; };
// ─── Transport ────────────────────────────────────────────────────────────────
/** Send a pre-approved Meta template message via Twilio Messaging Service */
const sendWhatsAppTemplate = (to, contentSid, variables, fallbackBody) => __awaiter(void 0, void 0, void 0, function* () {
    if (process.env.NODE_ENV === "test")
        return;
    const client = getTwilio();
    if (!client)
        return;
    // Sandbox: use free-form message (templates not supported on sandbox)
    if (isSandbox()) {
        const from = process.env.TWILIO_WHATSAPP_FROM;
        if (!from)
            return;
        try {
            yield client.messages.create({
                from: `whatsapp:${from}`,
                to: `whatsapp:${normalizePhone(to)}`,
                body: fallbackBody,
            });
        }
        catch (err) {
            console.error("[notifications] WhatsApp sandbox send failed:", err);
        }
        return;
    }
    // Business sender: use approved template via Messaging Service
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    if (!messagingServiceSid)
        return;
    try {
        yield client.messages.create({
            messagingServiceSid,
            to: `whatsapp:${normalizePhone(to)}`,
            contentSid,
            contentVariables: JSON.stringify(variables),
        });
    }
    catch (err) {
        console.error("[notifications] WhatsApp template send failed:", err);
    }
});
/** Send a free-form WhatsApp message (only works within a 24hr conversation window) */
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
// ─── Seller return templates (free-form — sent in reply to seller messages) ──
const sellerReturnScheduledText = (sellerName, brandName, itemName, returnDate) => [
    `📦 *Return Scheduled — Erlume*`,
    ``,
    `Hi ${sellerName},`,
    ``,
    `Your item has been scheduled for return.`,
    ``,
    `▸ *${brandName}* ${itemName}`,
    returnDate ? `📅 *Return date:* ${returnDate}` : null,
    ``,
    `We'll be in touch to arrange the handover. Thank you for consigning with Erlume! 🌿`,
    ``,
    `_Questions? Simply reply to this message._`,
]
    .filter((l) => l !== null)
    .join("\n");
const sellerReturnedText = (sellerName, brandName, itemName) => [
    `✅ *Item Returned — Erlume*`,
    ``,
    `Hi ${sellerName},`,
    ``,
    `Your item has been successfully returned to you.`,
    ``,
    `▸ *${brandName}* ${itemName}`,
    ``,
    `Thank you for consigning with Erlume. We hope to work with you again! 🌿`,
    ``,
    `_Questions? Simply reply to this message._`,
].join("\n");
// ─── Public API ───────────────────────────────────────────────────────────────
const sendOrderConfirmation = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const shortId = params.orderId.slice(-8).toUpperCase();
    const itemLines = params.items
        .map((i) => `▸ *${i.brandName}* ${i.itemName} — ${i.quantity} × KWD ${i.price}`)
        .join("\n");
    const fallback = [
        `🛍️ *Order Confirmed!*`,
        `_Thank you for shopping with Erlume._`,
        ``,
        `*Ref:* #${shortId}`,
        `━━━━━━━━━━━━━━━━━━`,
        itemLines,
        `━━━━━━━━━━━━━━━━━━`,
        `*Total: KWD ${params.totalAmount}*`,
        ``,
        `Your order is being prepared. We'll notify you once it's on its way. 📦`,
        ``,
        `_Questions? Simply reply to this message._`,
    ].join("\n");
    yield sendWhatsAppTemplate(params.phoneNumber, TEMPLATES.orderConfirmation, {
        "1": shortId,
        "2": itemLines,
        "3": params.totalAmount,
    }, fallback);
});
exports.sendOrderConfirmation = sendOrderConfirmation;
const sendOrderStatusUpdate = (params) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const shortId = params.orderId.slice(-8).toUpperCase();
    const status = params.status.toLowerCase();
    if (status === "shipped") {
        yield sendWhatsAppTemplate(params.phoneNumber, TEMPLATES.orderShipped, { "1": shortId }, `📦 *Your Order is On Its Way!*\n\nRef #${shortId} has been shipped and will arrive soon.\n\n_Questions? Reply to this message._`);
        return;
    }
    if (status === "delivered") {
        yield sendWhatsAppTemplate(params.phoneNumber, TEMPLATES.orderDelivered, { "1": shortId }, `🎉 *Order Delivered!*\n\nRef #${shortId} has been delivered.\n\nThank you for choosing Erlume. We hope you love your purchase! 🌿`);
        return;
    }
    // For statuses without a dedicated template (pending, processing, cancelled, returned)
    // use free-form — these only fire after the buyer has already received the order confirmation
    // so a conversation window is likely open
    const freeFormMessages = {
        pending: `🕐 *Order Received* — Ref #${shortId}\n\nYour order is awaiting confirmation.\n\n_We'll update you shortly._`,
        processing: `⚙️ *Order in Progress* — Ref #${shortId}\n\nYour order is being prepared.\n\n_We'll notify you once it ships._`,
        cancelled: `❌ *Order Cancelled* — Ref #${shortId}\n\nYour order has been cancelled.\n\n_Reply if you have any questions._`,
        returned: `🔄 *Return in Progress* — Ref #${shortId}\n\nYour return is being processed.\n\n_We'll confirm once complete._`,
    };
    const body = (_a = freeFormMessages[status]) !== null && _a !== void 0 ? _a : `📋 *Order Update* — Ref #${shortId}\nStatus: *${params.status}*`;
    yield sendWhatsApp(params.phoneNumber, body);
});
exports.sendOrderStatusUpdate = sendOrderStatusUpdate;
const sendOTP = (phoneNumber, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const body = [
        `🔐 *Erlume — Password Reset*`,
        ``,
        `Your verification code is:`,
        ``,
        `*${otp}*`,
        ``,
        `_This code expires in 10 minutes. Do not share it with anyone._`,
    ].join("\n");
    yield sendWhatsApp(phoneNumber, body);
});
exports.sendOTP = sendOTP;
const sendSellerReturnNotification = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const body = params.returnStatus === "returned"
        ? sellerReturnedText(params.sellerName, params.brandName, params.itemName)
        : sellerReturnScheduledText(params.sellerName, params.brandName, params.itemName, params.returnDate);
    yield sendWhatsApp(params.phoneNumber, body);
});
exports.sendSellerReturnNotification = sendSellerReturnNotification;
