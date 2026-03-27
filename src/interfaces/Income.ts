import { Document, Types } from "mongoose";

// _id = income._id. Income = Erlume bank receipt only. amount = what actually got to Erlume's account (commission, excluding seller payout).
export interface IncomeInterface extends Document {
	order_id?: Types.ObjectId; // Reference to Order (optional)
	order_item_id?: Types.ObjectId; // Reference to OrderItem (optional)
	item_id?: Types.ObjectId; // Reference to Item (optional)
	seller_id?: Types.ObjectId; // Reference to seller userId (optional)
	amount: string; // Erlume commission — what actually got to Erlume's bank account (excludes seller payout)
	erlumeCommissionAmount?: string; // Deprecated: use amount. Kept for backward compat.
	sellerPayoutAmount?: string; // Optional: seller payout for breakdown (Income focuses on Erlume receipt)
	currency?: string; // Currency code (e.g., KWD)
	platform?: string; // e.g., online, in_store
	income_type?: string; // e.g., sale, refund, manual
	received_at?: Date; // When income was received
	month?: Date; // Month for reporting (e.g. October 2026)
	prelaunch_bag?: string; // Item reference text (any product type) when item_id not linked. Format: Name-Brand-Year (e.g. "Brick Cassette -Bottega Veneta-2024")
	notes?: string; // Optional notes
	createdAt: Date;
	updatedAt: Date;
}
