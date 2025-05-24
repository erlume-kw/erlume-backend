import { Document, Types } from "mongoose";
import { Stars } from "../enums/reviewEnums"; // or "../enums/userEnums" if you put it there

export interface ReviewInterface extends Document {
	userId: Types.ObjectId; // Reference to User
	sellerId: Types.ObjectId; // Reference to Seller
	rating: Stars; // Rating value (1-5)
	description: string; // Review text
}
