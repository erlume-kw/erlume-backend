import mongoose, { Schema } from "mongoose";

const PayoutSchema = new Schema(
	{
		seller_id: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
		amount: { type: String, required: true },
		method: {
			type: String,
			enum: ["bank_transfer", "cash", "knet", "other"],
			default: "bank_transfer",
		},
		iban: { type: String },
		notes: { type: String },
		paid_at: { type: Date, required: true, default: Date.now },
	},
	{ timestamps: true },
);

const Payout = mongoose.model("Payout", PayoutSchema);

export default Payout;
