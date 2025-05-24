import { Document, Types } from "mongoose";
// _id = outfitItem._id // This is the outfititem_id --> auto generated in mongodb

export interface OutfitItemInterface extends Document {
	item_id: Types.ObjectId; // Reference to Item
	outfit_id: Types.ObjectId; // Reference to Outfit
	featured_in_product: boolean;
}
