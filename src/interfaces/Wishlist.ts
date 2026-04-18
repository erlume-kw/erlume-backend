// src/interfaces/Wishlist.ts

import { Document, Types } from "mongoose";

export interface WishlistInterface extends Document {
	user_id: Types.ObjectId;     // one wishlist per user
	item_ids: Types.ObjectId[];  // items the user saved
	createdAt: Date;
	updatedAt: Date;
}
