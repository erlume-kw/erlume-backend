import { Document, Types } from "mongoose";

// _id = income._id. Incomes = single source for commission breakdown: Erlume commission, income (sale amount), seller payout.
export interface IncomeInterface extends Document {
	order_id?: Types.ObjectId; // Reference to Order (optional)
	order_item_id?: Types.ObjectId; // Reference to OrderItem (optional)
	item_id?: Types.ObjectId; // Reference to Item (optional)
	seller_id?: Types.ObjectId; // Reference to seller userId (optional)
	amount: string; // Income amount (total/sale amount)
	erlumeCommissionAmount?: string; // Erlume commission for this line
	sellerPayoutAmount?: string; // Seller payout for this line
	currency?: string; // Currency code (e.g., KWD)
	platform?: string; // e.g., online, in_store
	income_type?: string; // e.g., sale, refund, manual
	received_at?: Date; // When income was received
	notes?: string; // Optional notes
	createdAt: Date;
	updatedAt: Date;
}
