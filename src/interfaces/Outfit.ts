import { Document, Types } from "mongoose";
// _id = outfit._id // This is the outfit_id --> auto generated in mongodb

export interface OutfitInterface extends Document {
	item_ids: Types.ObjectId[]; // List of items in the outfit
	outfit_title: string;
	outfit_tags: string;
}
