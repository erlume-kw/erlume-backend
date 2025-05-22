import { Document, Types } from "mongoose";
import { Stars } from "../enums/reviewEnums"; // or "../enums/userEnums" if you put it there

export interface IReview extends Document {
	userId?: Types.ObjectId; // Optional: for anonymous reviews
	sellerId: Types.ObjectId; // The seller being reviewed
	rating: Stars; // Use the enum here
	description: string;
}
