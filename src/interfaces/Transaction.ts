import { Document, Types } from "mongoose";
// _id = transaction._id // This is the transaction_id --> auto generated in mongodb

export interface TransactionInterface extends Document {
	order_id: Types.ObjectId; // Reference to Order
	discount_rate: string;
	amount: string;
	discount_id?: Types.ObjectId; // Reference to DiscountCode (optional)
}
