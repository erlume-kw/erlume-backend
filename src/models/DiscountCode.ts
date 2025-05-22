import mongoose, { Schema } from "mongoose";
import { DiscountCodeInterface } from "../interfaces/DiscountCode";

const DiscountCodeSchema: Schema = new Schema(
	{
		discount_rate: { type: String, required: true },
		discount_code: { type: String, required: true },
	},
	{ timestamps: true },
);

const DiscountCode = mongoose.model<DiscountCodeInterface>(
	"DiscountCode",
	DiscountCodeSchema,
);

export default DiscountCode;
