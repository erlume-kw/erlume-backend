import { Request, Response } from "express";
import Transaction from "../models/Transaction";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import Item from "../models/Item";
import User from "../models/User";
import DiscountCode from "../models/DiscountCode";
import mongoose from "mongoose";
import { TransactionStatus } from "../enums/transactionEnums";
import { PaymentMethod } from "../enums/paymentEnums";
import { getMonthYearDateRange } from "../utils/dateRange";
import { createZohoInvoice } from "../utils/zohoInvoice";
import { sendOrderConfirmation, type OrderItemSummary } from "../utils/notifications";

// ─── Helper: build and send Zoho invoice for an order ────────────────────────
const isKnown = (v?: string | null) => v && v.toLowerCase() !== "unknown";

async function fireZohoInvoice(
	orderId: string,
	discountedAmount: number,
	discountRate: number,
): Promise<void> {
	try {
		const order = await Order.findById(orderId);
		if (!order) return;

		// Resolve customer contact info
		let notifPhone: string | undefined;
		let notifEmail: string | undefined;
		let customerName: string;

		if (order.user_id) {
			const user = await User.findById(order.user_id);
			notifPhone   = user?.phoneNumber;
			notifEmail   = user?.emailAddress;
			customerName = user?.emailAddress ?? notifPhone ?? "Customer";
		} else {
			const g      = (order as any).guestInfo;
			notifPhone   = g?.phoneNumber;
			notifEmail   = g?.emailAddress;
			customerName = g?.name ?? g?.phoneNumber ?? "Guest";
		}

		// Build line items from DB
		const orderItems = await OrderItem.find({ order_id: orderId }).lean();
		const zohoLineItems: { name: string; quantity: number; rate: number }[] = [];
		const itemSummaries: OrderItemSummary[] = [];
		let fullTotal = 0;

		for (const oi of orderItems) {
			const item = await Item.findById(oi.item_id).lean();
			if (!item) continue;
			const qty      = Number(oi.quantity) || 1;
			const rate     = parseFloat(item.listingPrice);
			fullTotal     += rate * qty;

			const parts = [
				`${item.brandName} — ${item.itemName}`,
				isKnown(item.color) ? item.color          : null,
				isKnown(item.size)  ? `Size: ${item.size}` : null,
			].filter(Boolean);

			zohoLineItems.push({ name: parts.join(" · "), quantity: qty, rate });
			itemSummaries.push({
				itemName:  item.itemName,
				brandName: item.brandName,
				quantity:  qty,
				price:     rate.toFixed(2),
			});
		}

		const zohoResult = await createZohoInvoice({
			orderId,
			customerName,
			phoneNumber:  notifPhone ?? "",
			email:        notifEmail || undefined,
			items:        zohoLineItems,
			totalAmount:  discountedAmount,
			discountRate: discountRate > 0 ? discountRate : undefined,
		});

		// Send one combined WhatsApp: order confirmation + discount breakdown + invoice link
		if (notifPhone) {
			await sendOrderConfirmation({
				emailAddress:   notifEmail ?? "",
				phoneNumber:    notifPhone,
				orderId,
				items:          itemSummaries,
				totalAmount:    fullTotal.toFixed(2),
				...(discountRate > 0 ? {
					discountRate,
					discountedTotal: discountedAmount.toFixed(2),
				} : {}),
				invoiceUrl: zohoResult?.invoiceUrl,
			});
		}

		// Notify Erlume team
		try {
			const { Resend } = await import("resend");
			const resend = new Resend(process.env.RESEND_API_KEY);
			const itemRows = itemSummaries.map(i =>
				`<tr>
					<td style="padding:6px 0;border-bottom:1px solid #eee;">${i.brandName} — ${i.itemName}</td>
					<td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">KD ${i.price}</td>
				</tr>`
			).join("");
			const total = discountRate > 0
				? `<s style="color:#999;">KD ${fullTotal.toFixed(2)}</s> → <strong>KD ${discountedAmount.toFixed(2)}</strong> (${discountRate}% off)`
				: `<strong>KD ${fullTotal.toFixed(2)}</strong>`;

			await resend.emails.send({
				from:    process.env.RESEND_FROM ?? "orders@erlume.com.kw",
				to:      ["info@erlume.com.kw"],
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
						${zohoResult?.invoiceNumber ? `<p style="margin:0 0 16px;font-size:14px;color:#444;">Invoice: <strong>${zohoResult.invoiceNumber}</strong></p>` : ""}
						${zohoResult?.invoiceId ? `<a href="https://invoice.zoho.com/app/${process.env.ZOHO_ORG_ID}/invoices/${zohoResult.invoiceId}" style="background:#111d11;color:#fff;padding:11px 24px;border-radius:5px;text-decoration:none;font-size:13px;">Open in Zoho Invoice</a>` : ""}
						<p style="margin-top:24px;font-size:11px;color:#bbb;">${new Date().toLocaleString("en-KW", { timeZone: "Asia/Kuwait" })}</p>
					</div>`,
			});
		} catch (emailErr) {
			console.error("[transactionController] Team notification email failed:", emailErr);
		}
	} catch (err) {
		console.error("[transactionController] Zoho invoice error:", err);
	}
}

const getTransactions = async (req: Request, res: Response): Promise<void> => {
	try {
		const { year, month } = req.query;
		const filter: Record<string, unknown> = {};
		const { range, error } = getMonthYearDateRange(year, month);
		if (error) {
			res.status(400).json({ success: false, error });
			return;
		}
		if (range) {
			filter.createdAt = range;
		}

		const transactions = await Transaction.find(filter)
			.populate("order_id")
			.populate("discount_id");
		res.status(200).json({
			success: true,
			data: transactions,
			count: transactions.length,
		});
	} catch (error) {
		console.error("Error in getTransactions:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getTransactionsByOrderId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const orderId = req.params.orderId;
		const { year, month } = req.query;

		if (!mongoose.Types.ObjectId.isValid(orderId)) {
			res.status(400).json({ success: false, error: "Invalid order ID" });
			return;
		}

		const order = await Order.findById(orderId);
		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		const filter: Record<string, unknown> = { order_id: orderId };
		const { range, error } = getMonthYearDateRange(year, month);
		if (error) {
			res.status(400).json({ success: false, error });
			return;
		}
		if (range) {
			filter.createdAt = range;
		}

		const transactions = await Transaction.find(filter)
			.populate("order_id")
			.populate("discount_id");

		res.status(200).json({
			success: true,
			data: transactions,
			count: transactions.length,
		});
	} catch (error) {
		console.error("Error in getTransactionsByOrderId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getTransactionById = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const transactionId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(transactionId)) {
			res.status(400).json({ success: false, error: "Invalid transaction ID" });
			return;
		}

		const transaction = await Transaction.findById(transactionId)
			.populate("order_id")
			.populate("discount_id");

		if (!transaction) {
			res.status(404).json({ success: false, error: "Transaction not found" });
			return;
		}

		res.status(200).json({ success: true, data: transaction });
	} catch (error) {
		console.error("Error in getTransactionById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

	const createTransaction = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { order_id, discount_rate, amount, discount_id, paymentMethod } =
			req.body;

		// Validate required fields
		if (!order_id || !discount_rate || !amount) {
			res.status(400).json({
				success: false,
				error: "Missing required fields: order_id, discount_rate, amount",
			});
			return;
		}

		// Validate order_id
		if (!mongoose.Types.ObjectId.isValid(order_id)) {
			res.status(400).json({ success: false, error: "Invalid order_id" });
			return;
		}

		const order = await Order.findById(order_id);
		if (!order) {
			res.status(404).json({ success: false, error: "Order not found" });
			return;
		}

		// If a transaction already exists, update it with the new discount/amount and create invoice
		const existingTransaction = await Transaction.findOne({ order_id });
		if (existingTransaction) {
			const update: Record<string, unknown> = {};
			if (discount_rate !== undefined) update.discount_rate = discount_rate;
			if (amount       !== undefined) update.amount         = amount;
			if (discount_id  !== undefined) update.discount_id    = discount_id || null;
			if (paymentMethod!== undefined) update.paymentMethod  = paymentMethod || null;

			const updatedTransaction = await Transaction.findByIdAndUpdate(
				existingTransaction._id,
				{ $set: update },
				{ new: true },
			).populate("order_id").populate("discount_id");

			// Fire Zoho invoice with the correct (discounted) amount
			void fireZohoInvoice(
				String(order_id),
				parseFloat(amount) || 0,
				parseFloat(discount_rate) || 0,
			);

			res.status(200).json({
				success: true,
				message: "Transaction updated with discount and invoice queued",
				data: updatedTransaction,
			});
			return;
		}

		// Validate discount_id if provided
		if (discount_id) {
			if (!mongoose.Types.ObjectId.isValid(discount_id)) {
				res.status(400).json({ success: false, error: "Invalid discount_id" });
				return;
			}

			const discount = await DiscountCode.findById(discount_id);
			if (!discount) {
				res.status(404).json({
					success: false,
					error: "Discount code not found",
				});
				return;
			}
		}

		// Validate paymentMethod if provided
		if (paymentMethod && !Object.values(PaymentMethod).includes(paymentMethod)) {
			res.status(400).json({
				success: false,
				error: `Invalid paymentMethod. Must be one of: ${Object.values(
					PaymentMethod,
				).join(", ")}`,
			});
			return;
		}

		// Create transaction
		const newTransaction = new Transaction({
			order_id,
			discount_rate,
			amount,
			discount_id,
			status: TransactionStatus.Pending, // Default status
			paymentMethod: paymentMethod || undefined, // Optional payment method
		});

		const savedTransaction = await newTransaction.save();

		// Fire Zoho invoice
		void fireZohoInvoice(
			String(order_id),
			parseFloat(amount) || 0,
			parseFloat(discount_rate) || 0,
		);

		res.status(201).json({
			success: true,
			message: "Transaction created successfully",
			data: savedTransaction,
		});
	} catch (error: any) {
		console.error("Error in createTransaction:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const updateTransaction = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const transactionId = req.params.id;
		const { discount_rate, amount, discount_id, status, paymentMethod } =
			req.body;

		if (!mongoose.Types.ObjectId.isValid(transactionId)) {
			res.status(400).json({ success: false, error: "Invalid transaction ID" });
			return;
		}

		const transaction = await Transaction.findById(transactionId);
		if (!transaction) {
			res.status(404).json({ success: false, error: "Transaction not found" });
			return;
		}

		// Build update object - only update fields that are provided
		const update: any = {};

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
			} else {
				if (!mongoose.Types.ObjectId.isValid(discount_id)) {
					res.status(400).json({
						success: false,
						error: "Invalid discount_id",
					});
					return;
				}

				const discount = await DiscountCode.findById(discount_id);
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
			if (!Object.values(TransactionStatus).includes(status)) {
				res.status(400).json({
					success: false,
					error: `Invalid status. Must be one of: ${Object.values(
						TransactionStatus,
					).join(", ")}`,
				});
				return;
			}
			update.status = status;
		}

		if (paymentMethod !== undefined) {
			if (paymentMethod === null || paymentMethod === "") {
				// Allow clearing the paymentMethod
				update.paymentMethod = null;
			} else {
				if (!Object.values(PaymentMethod).includes(paymentMethod)) {
					res.status(400).json({
						success: false,
						error: `Invalid paymentMethod. Must be one of: ${Object.values(
							PaymentMethod,
						).join(", ")}`,
					});
					return;
				}
				update.paymentMethod = paymentMethod;
			}
		}

		// Update transaction
		const updatedTransaction = await Transaction.findByIdAndUpdate(
			transactionId,
			{ $set: update },
			{ new: true, runValidators: true },
		)
			.populate("order_id")
			.populate("discount_id");

		res.status(200).json({
			success: true,
			message: "Transaction updated successfully",
			data: updatedTransaction,
		});
	} catch (error: any) {
		console.error("Error in updateTransaction:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const updateTransactionStatus = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const transactionId = req.params.id;
		const { status } = req.body;

		if (!mongoose.Types.ObjectId.isValid(transactionId)) {
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

		if (!Object.values(TransactionStatus).includes(status)) {
			res.status(400).json({
				success: false,
				error: `Invalid status. Must be one of: ${Object.values(
					TransactionStatus,
				).join(", ")}`,
			});
			return;
		}

		const transaction = await Transaction.findById(transactionId);
		if (!transaction) {
			res.status(404).json({ success: false, error: "Transaction not found" });
			return;
		}

		const updatedTransaction = await Transaction.findByIdAndUpdate(
			transactionId,
			{ status },
			{ new: true, runValidators: true },
		)
			.populate("order_id")
			.populate("discount_id");

		res.status(200).json({
			success: true,
			message: "Transaction status updated successfully",
			data: updatedTransaction,
		});
	} catch (error: any) {
		console.error("Error in updateTransactionStatus:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const deleteTransaction = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const transactionId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(transactionId)) {
			res.status(400).json({ success: false, error: "Invalid transaction ID" });
			return;
		}

		const transaction = await Transaction.findById(transactionId);
		if (!transaction) {
			res.status(404).json({ success: false, error: "Transaction not found" });
			return;
		}

		await Transaction.findByIdAndDelete(transactionId);

		res.status(200).json({
			success: true,
			message: "Transaction deleted successfully",
			data: { id: transactionId },
		});
	} catch (error) {
		console.error("Error in deleteTransaction:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getTransactions,
	getTransactionsByOrderId,
	getTransactionById,
	createTransaction,
	updateTransaction,
	updateTransactionStatus,
	deleteTransaction,
};
