import mongoose, { Schema } from "mongoose";
import { IDiscountCode } from "../interfaces/IDiscountCode";

const DiscountCodeSchema: Schema = new Schema(
	{
		discount_rate: { type: String, required: true },
		discount_code: { type: String, required: true },
	},
	{ timestamps: true },
);

const DiscountCode = mongoose.model<IDiscountCode>(
	"DiscountCode",
	DiscountCodeSchema,
);

export default DiscountCode;
