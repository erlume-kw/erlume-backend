import mongoose, { Schema, Document, Types } from "mongoose";
import { IItem } from "../interfaces/IItem"; // Import the IItem interface
import { ItemCondition } from "../enums/itemEnums"; // Import the ItemCondition enum
import { ItemStatus } from "../enums/statusEnums"; // Import the ItemStatus enum
import OutfitItem from "./OutfitItem";
import OrderItem from "./OrderItem";

// Create the Item schema
const ItemSchema: Schema = new Schema(
	{
		_id: { type: Schema.Types.ObjectId, required: true }, // Item's unique ID
		basePrice: { type: String, required: true },
		//imageId: { type: Schema.Types.ObjectId, ref: "Image", required: true }, // Foreign key reference to Image
		condition: {
			type: String,
			enum: Object.values(ItemCondition),
			required: true,
		}, // Enum for condition
		uploadedAt: { type: Date, required: true },
		saleRate: { type: String, required: true },
		itemStatus: {
			type: String,
			enum: Object.values(ItemStatus),
			required: true,
		}, // Enum for status
		color: { type: String, required: true },
		size: { type: String, required: true },
		itemName: { type: String, required: true },
		quantity: { type: String, required: true },
		brandName: { type: String, required: true },
		imageUrls: [{ type: String, required: true }], // List of URLs of the item's images
		category_id: {
			type: Schema.Types.ObjectId,
			ref: "Category",
			required: true,
			index: true,
		},
		sub_category_id: {
			type: Schema.Types.ObjectId,
			ref: "SubCategory",
			index: true,
		}, // Optional
	},
	{ timestamps: true },
); // Automatically manage createdAt and updatedAt

// Cascade delete OrderItems and OutfitItems when an Item is deleted
ItemSchema.pre("findOneAndDelete", async function (next) {
	const doc = await this.model.findOne(this.getFilter());
	if (doc) {
		await OutfitItem.deleteMany({ item_id: doc._id });
		await OrderItem.deleteMany({ item_id: doc._id });
	}
	next();
});

// Create the Item model
const Item = mongoose.model<IItem>("Item", ItemSchema);

export default Item;
