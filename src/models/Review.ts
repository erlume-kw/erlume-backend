import mongoose, { Schema } from "mongoose";
import { ReviewInterface } from "../interfaces/Review";
import { Stars } from "../enums/reviewEnums";
const ReviewSchema: Schema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: false,
			index: true,
		}, // Optional for anonymous
		sellerId: {
			type: Schema.Types.ObjectId,
			ref: "Seller",
			required: true,
			index: true,
		},
		rating: {
			type: Number,
			required: true,
			enum: Object.values(Stars), // Only allow 1-5
		},
		description: { type: String, required: true },
	},
	{ timestamps: true },
);

const Review = mongoose.model<ReviewInterface>("Review", ReviewSchema);

export default Review;
