import mongoose, { Schema } from "mongoose";
import { OutfitInterface } from "../interfaces/Outfit";
import OutfitItem from "./OutfitItem";

const OutfitSchema: Schema = new Schema(
	{
		item_ids: [
			{ type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
		],
		outfit_title: { type: String, required: true },
		outfit_tags: { type: String, required: true },
	},
	{ timestamps: true },
);

// Cascade delete OutfitItems when an Outfit is deleted
OutfitSchema.pre("findOneAndDelete", async function (next) {
	const doc = await this.model.findOne(this.getFilter());
	if (doc) {
		await OutfitItem.deleteMany({ outfit_id: doc._id });
	}
	next();
});

const Outfit = mongoose.model<OutfitInterface>("Outfit", OutfitSchema);

export default Outfit;
