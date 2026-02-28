import { Document, Types } from "mongoose";

// _id = sale._id // This is the sale_id --> auto generated in mongodb
export interface SaleInterface extends Document {
	order_id?: Types.ObjectId;
	order_item_id?: Types.ObjectId;
	item_id?: Types.ObjectId;
	transaction_id?: Types.ObjectId;
	amount?: string; // Total listing price (gross)
	listingPrice?: string;
	erlumeCommission?: string; // Erlume's cut from this sale
	sellerPayout?: string; // Seller's cut
	buyer?: string;
	status?: string;
	sale_date?: Date;
	bag_record?: string; // Item reference text (any product type). Format: Name-Brand-Year. CSV column: Bag Record.
	invoice_number?: string;
	invoice_url?: string;
	payment_evidence_url?: string;
	createdAt: Date;
	updatedAt: Date;
}
