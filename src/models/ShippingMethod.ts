// src/models/ShippingMethod.ts

import mongoose, { Schema } from "mongoose";
import { ShippingMethodInterface } from "../interfaces/ShippingMethod";
import { KuwaitGovernorate } from "../enums/kuwaitEnums";

const ShippingMethodSchema: Schema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, trim: true },
		price: { type: Number, required: true, min: 0 }, // KWD
		// Empty array = applies to ALL governorates
		zones: [
			{
				type: String,
				enum: Object.values(KuwaitGovernorate),
			},
		],
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true },
);

const ShippingMethod = mongoose.model<ShippingMethodInterface>(
	"ShippingMethod",
	ShippingMethodSchema,
);

export default ShippingMethod;
