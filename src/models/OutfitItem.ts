import mongoose, { Schema } from "mongoose";
import { OutfitItemInterface } from "../interfaces/OutfitItem";

const OutfitItemSchema: Schema = new Schema(
	{
		item_id: {
			type: Schema.Types.ObjectId,
			ref: "Item",
			required: true,
			index: true,
		},
		outfit_id: {
			type: Schema.Types.ObjectId,
			ref: "Outfit",
			required: true,
			index: true,
		},
		featured_in_product: { type: Boolean, required: true },
	},
	{ timestamps: true },
);

const OutfitItem = mongoose.model<OutfitItemInterface>("OutfitItem", OutfitItemSchema);

export default OutfitItem;
