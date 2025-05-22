import mongoose, { Schema } from "mongoose";
import { ITransaction } from "../interfaces/ITransaction";

const TransactionSchema: Schema = new Schema(
	{
		order_id: {
			type: Schema.Types.ObjectId,
			ref: "Order",
			required: true,
			index: true,
		},
		discount_rate: { type: String, required: true },
		amount: { type: String, required: true },
		discount_id: { type: Schema.Types.ObjectId, ref: "DiscountCode" }, // Optional
	},
	{ timestamps: true },
);

const Transaction = mongoose.model<ITransaction>(
	"Transaction",
	TransactionSchema,
);

export default Transaction;
