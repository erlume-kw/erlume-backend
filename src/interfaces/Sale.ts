import { Document, Types } from "mongoose";

// _id = sale._id // This is the sale_id --> auto generated in mongodb
export interface SaleInterface extends Document {
	order_id: Types.ObjectId; // Reference to Order
	order_item_id: Types.ObjectId; // Reference to OrderItem
	transaction_id?: Types.ObjectId; // Reference to Transaction (optional)
	invoice_number?: string;
	invoice_url?: string;
	payment_evidence_url?: string;
	createdAt: Date;
	updatedAt: Date;
}
