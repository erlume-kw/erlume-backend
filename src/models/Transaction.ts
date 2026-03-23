import mongoose, { Schema } from "mongoose";
import { TransactionInterface } from "../interfaces/Transaction";
import { TransactionStatus } from "../enums/transactionEnums";
import { PaymentMethod } from "../enums/paymentEnums";

const TransactionSchema: Schema = new Schema(
	{
		order_id: {
			type: Schema.Types.ObjectId,
			ref: "Order",
			required: true,
			unique: true,
			index: true,
		},
		discount_rate: { type: String, required: true },
		amount: { type: String, required: true },
		discount_id: { type: Schema.Types.ObjectId, ref: "DiscountCode" }, // Optional
		status: {
			type: String,
			enum: Object.values(TransactionStatus),
			default: TransactionStatus.Pending,
			required: true,
			index: true,
		},
		paymentMethod: {
			type: String,
			enum: Object.values(PaymentMethod),
			required: false,
			index: true,
		},
	},
	{ timestamps: true },
);

const Transaction = mongoose.model<TransactionInterface>(
	"Transaction",
	TransactionSchema,
);

export default Transaction;
