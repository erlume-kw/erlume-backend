import twilio from "twilio";

export interface OrderItemSummary {
	itemName: string;
	brandName: string;
	quantity: number;
	price: string;
}

// ─── Client helpers ───────────────────────────────────────────────────────────

const normalizePhone = (phone: string): string => {
	const cleaned = phone.replace(/[\s\-]/g, "");
	return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
};

const getTwilio = (): ReturnType<typeof twilio> | null => {
	if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
	return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

// ─── Transport ────────────────────────────────────────────────────────────────

const sendWhatsApp = async (to: string, body: string): Promise<void> => {
	if (process.env.NODE_ENV === "test") return;
	const client = getTwilio();
	const from = process.env.TWILIO_WHATSAPP_FROM;
	if (!client || !from) return;
	try {
		await client.messages.create({
			from: `whatsapp:${from}`,
			to: `whatsapp:${normalizePhone(to)}`,
			body,
		});
	} catch (err) {
		console.error("[notifications] WhatsApp send failed:", err);
	}
};

// ─── Message templates ────────────────────────────────────────────────────────

const orderConfirmationText = (
	orderId: string,
	items: OrderItemSummary[],
	totalAmount: string,
): string => {
	const shortId = orderId.slice(-8).toUpperCase();
	const itemLines = items
		.map((i) => `  • ${i.brandName} ${i.itemName} × ${i.quantity} — KWD ${i.price}`)
		.join("\n");
	return `Erlume — Order Confirmed ✅\nRef #${shortId}\n\n${itemLines}\n\nTotal: KWD ${totalAmount}\n\nWe'll keep you updated on your order.`;
};

const statusUpdateText = (
	orderId: string,
	status: string,
	trackingReference?: string,
): string => {
	const shortId = orderId.slice(-8).toUpperCase();
	const messages: Record<string, string> = {
		Processing: `Your Erlume order #${shortId} is being processed. 🛍️`,
		Shipped: trackingReference
			? `Your Erlume order #${shortId} has shipped. 📦\nTracking: ${trackingReference}`
			: `Your Erlume order #${shortId} has shipped. 📦`,
		Delivered: `Your Erlume order #${shortId} has been delivered. 🎉\nThank you for shopping with Erlume!`,
		Cancelled: `Your Erlume order #${shortId} has been cancelled.\nContact us if you have any questions.`,
		Returned: `Your Erlume order #${shortId} return is being processed.`,
	};
	return messages[status] ?? `Your Erlume order #${shortId} status updated: ${status}`;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const sendOrderConfirmation = async (params: {
	emailAddress: string;
	phoneNumber: string;
	orderId: string;
	items: OrderItemSummary[];
	totalAmount: string;
}): Promise<void> => {
	await sendWhatsApp(
		params.phoneNumber,
		orderConfirmationText(params.orderId, params.items, params.totalAmount),
	);
};

export const sendOrderStatusUpdate = async (params: {
	emailAddress: string;
	phoneNumber: string;
	orderId: string;
	status: string;
	trackingReference?: string;
}): Promise<void> => {
	await sendWhatsApp(
		params.phoneNumber,
		statusUpdateText(params.orderId, params.status, params.trackingReference),
	);
};
