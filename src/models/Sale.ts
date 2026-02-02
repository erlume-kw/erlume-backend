import mongoose, { Schema } from "mongoose";
import { SaleInterface } from "../interfaces/Sale";

const SaleSchema: Schema = new Schema(
	{
		order_id: {
			type: Schema.Types.ObjectId,
			ref: "Order",
			required: true,
			index: true,
		},
		order_item_id: {
			type: Schema.Types.ObjectId,
			ref: "OrderItem",
			required: true,
			index: true,
		},
		transaction_id: {
			type: Schema.Types.ObjectId,
			ref: "Transaction",
			required: false,
			index: true,
		},
		invoice_number: { type: String, required: false },
		invoice_url: { type: String, required: false },
		payment_evidence_url: { type: String, required: false },
	},
	{ timestamps: true },
);

const Sale = mongoose.model<SaleInterface>("Sale", SaleSchema);

export default Sale;
