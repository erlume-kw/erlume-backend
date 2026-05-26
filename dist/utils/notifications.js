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
const resend_1 = require("resend");
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
const getResend = () => {
    if (!process.env.RESEND_API_KEY)
        return null;
    return new resend_1.Resend(process.env.RESEND_API_KEY);
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
const sendEmail = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (process.env.NODE_ENV === "test")
        return;
    const client = getResend();
    const from = (_a = process.env.RESEND_FROM_EMAIL) !== null && _a !== void 0 ? _a : "onboarding@resend.dev";
    if (!client)
        return;
    try {
        yield client.emails.send({ from, to, subject, html });
    }
    catch (err) {
        console.error("[notifications] Email send failed:", err);
    }
});
// ─── Email templates ──────────────────────────────────────────────────────────
const orderConfirmationHtml = (orderId, items, totalAmount) => {
    const shortId = orderId.slice(-8).toUpperCase();
    const itemRows = items
        .map((i) => `
			<tr>
				<td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">${i.brandName} — ${i.itemName}</td>
				<td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${i.quantity}</td>
				<td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right">KWD ${i.price}</td>
			</tr>`)
        .join("");
    return `
	<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
		<div style="background:#1a1a1a;padding:24px 32px">
			<span style="color:#fff;font-size:22px;letter-spacing:4px;font-weight:300">ERLUME</span>
		</div>
		<div style="padding:32px">
			<h2 style="font-weight:400;font-size:20px;margin:0 0 6px">Order Confirmed</h2>
			<p style="color:#888;font-size:13px;margin:0 0 28px">Reference #${shortId}</p>
			<table style="width:100%;border-collapse:collapse;font-size:14px">
				<thead>
					<tr style="background:#f8f8f8">
						<th style="padding:10px 12px;text-align:left;font-weight:500">Item</th>
						<th style="padding:10px 12px;text-align:center;font-weight:500">Qty</th>
						<th style="padding:10px 12px;text-align:right;font-weight:500">Price</th>
					</tr>
				</thead>
				<tbody>${itemRows}</tbody>
				<tfoot>
					<tr>
						<td colspan="2" style="padding:12px;text-align:right;font-weight:500">Total</td>
						<td style="padding:12px;text-align:right;font-weight:600">KWD ${totalAmount}</td>
					</tr>
				</tfoot>
			</table>
			<p style="margin:28px 0 0;font-size:13px;color:#555">
				We'll send you an update as your order progresses. For any questions, reply to this email.
			</p>
		</div>
		<div style="background:#f8f8f8;padding:16px 32px;font-size:11px;color:#aaa;text-align:center">
			© ${new Date().getFullYear()} Erlume · Luxury Resale
		</div>
	</div>`;
};
const statusUpdateHtml = (orderId, status, trackingReference) => {
    var _a;
    const shortId = orderId.slice(-8).toUpperCase();
    const content = {
        Processing: {
            headline: "Your order is being processed",
            body: "Our team is preparing your order. We'll notify you once it ships.",
        },
        Shipped: {
            headline: "Your order is on its way",
            body: trackingReference
                ? `Your order has been dispatched. Your tracking reference is <strong>${trackingReference}</strong>.`
                : "Your order has been dispatched.",
        },
        Delivered: {
            headline: "Your order has been delivered",
            body: "We hope you love your purchase. Thank you for shopping with Erlume.",
        },
        Cancelled: {
            headline: "Your order has been cancelled",
            body: "Your order has been cancelled. If you have any questions, please reply to this email.",
        },
        Returned: {
            headline: "Return in progress",
            body: "We've received your return request and will process it shortly.",
        },
    };
    const { headline, body } = (_a = content[status]) !== null && _a !== void 0 ? _a : {
        headline: `Order status updated to ${status}`,
        body: "",
    };
    return `
	<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
		<div style="background:#1a1a1a;padding:24px 32px">
			<span style="color:#fff;font-size:22px;letter-spacing:4px;font-weight:300">ERLUME</span>
		</div>
		<div style="padding:32px">
			<h2 style="font-weight:400;font-size:20px;margin:0 0 6px">${headline}</h2>
			<p style="color:#888;font-size:13px;margin:0 0 20px">Reference #${shortId}</p>
			<p style="font-size:14px;color:#555;margin:0">${body}</p>
		</div>
		<div style="background:#f8f8f8;padding:16px 32px;font-size:11px;color:#aaa;text-align:center">
			© ${new Date().getFullYear()} Erlume · Luxury Resale
		</div>
	</div>`;
};
// ─── WhatsApp / SMS templates ─────────────────────────────────────────────────
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
    const { emailAddress, phoneNumber, orderId, items, totalAmount } = params;
    const shortId = orderId.slice(-8).toUpperCase();
    yield Promise.allSettled([
        sendEmail(emailAddress, `Order Confirmed — #${shortId}`, orderConfirmationHtml(orderId, items, totalAmount)),
        sendWhatsApp(phoneNumber, orderConfirmationText(orderId, items, totalAmount)),
    ]);
});
exports.sendOrderConfirmation = sendOrderConfirmation;
const sendOrderStatusUpdate = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { emailAddress, phoneNumber, orderId, status, trackingReference } = params;
    const shortId = orderId.slice(-8).toUpperCase();
    yield Promise.allSettled([
        sendEmail(emailAddress, `Order Update — #${shortId}`, statusUpdateHtml(orderId, status, trackingReference)),
        sendWhatsApp(phoneNumber, statusUpdateText(orderId, status, trackingReference)),
    ]);
});
exports.sendOrderStatusUpdate = sendOrderStatusUpdate;
