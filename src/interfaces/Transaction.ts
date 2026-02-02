import { Document, Types } from "mongoose";
import { TransactionStatus } from "../enums/transactionEnums";
import { PaymentMethod } from "../enums/paymentEnums";

// _id = transaction._id // This is the transaction_id --> auto generated in mongodb

export interface TransactionInterface extends Document {
	order_id: Types.ObjectId; // Reference to Order
	discount_rate: string;
	amount: string;
	discount_id?: Types.ObjectId; // Reference to DiscountCode (optional)
	status: TransactionStatus; // Transaction status
	paymentMethod?: PaymentMethod; // Payment method used (optional)
}
