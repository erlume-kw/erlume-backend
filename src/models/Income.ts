import mongoose, { Schema } from "mongoose";
import { IncomeInterface } from "../interfaces/Income";

const IncomeSchema: Schema = new Schema(
	{
		order_id: {
			type: Schema.Types.ObjectId,
			ref: "Order",
			required: false,
			index: true,
		},
		order_item_id: {
			type: Schema.Types.ObjectId,
			ref: "OrderItem",
			required: false,
			index: true,
		},
		item_id: {
			type: Schema.Types.ObjectId,
			ref: "Item",
			required: false,
			index: true,
		},
		seller_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: false,
			index: true,
		},
		amount: { type: String, required: true },
		erlumeCommissionAmount: { type: String, required: false },
		sellerPayoutAmount: { type: String, required: false },
		currency: { type: String, default: "KWD" },
		platform: { type: String, required: false },
		income_type: { type: String, default: "sale" },
		received_at: { type: Date, default: Date.now, index: true },
		notes: { type: String, required: false },
	},
	{ timestamps: true },
);

const Income = mongoose.model<IncomeInterface>("Income", IncomeSchema);

export default Income;
