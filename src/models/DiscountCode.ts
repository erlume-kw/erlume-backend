import mongoose, { Schema } from "mongoose";
import { DiscountCodeInterface } from "../interfaces/DiscountCode";

const DiscountCodeSchema: Schema = new Schema(
	{
		code: { type: String, required: true, unique: true },
		discount_percentage: { type: String, required: true },
		expiry_date: { type: Date, required: true },
		is_active: { type: Boolean, required: true, default: true },
	},
	{ timestamps: true },
);

const DiscountCode = mongoose.model<DiscountCodeInterface>(
	"DiscountCode",
	DiscountCodeSchema,
);

export default DiscountCode;
