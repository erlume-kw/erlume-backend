import mongoose, { Schema } from "mongoose";
import { SaleInterface } from "../interfaces/Sale";

const SaleSchema: Schema = new Schema(
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
		transaction_id: {
			type: Schema.Types.ObjectId,
			ref: "Transaction",
			required: false,
			index: true,
		},
		amount: { type: String, required: false }, // Total listing price (gross)
		listingPrice: { type: String, required: false },
		erlumeCommission: { type: String, required: false }, // Erlume's cut from this sale
		sellerPayout: { type: String, required: false }, // Seller's cut
		buyer: { type: String, required: false },
		status: { type: String, required: false },
		sale_date: { type: Date, required: false, index: true },
		bag_record: { type: String, required: false },
		invoice_number: { type: String, required: false },
		invoice_url: { type: String, required: false },
		payment_evidence_url: { type: String, required: false },
	},
	{ timestamps: true },
);

const Sale = mongoose.model<SaleInterface>("Sale", SaleSchema);

export default Sale;
