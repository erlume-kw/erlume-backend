// src/models/Wishlist.ts

import mongoose, { Schema } from "mongoose";
import { WishlistInterface } from "../interfaces/Wishlist";

const WishlistSchema: Schema = new Schema(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true, // one wishlist per user
		},
		item_ids: [
			{
				type: Schema.Types.ObjectId,
				ref: "Item",
			},
		],
	},
	{ timestamps: true },
);

const Wishlist = mongoose.model<WishlistInterface>("Wishlist", WishlistSchema);

export default Wishlist;
