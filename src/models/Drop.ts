import mongoose, { Schema } from "mongoose";
import { DropInterface } from "../interfaces/Drop";
import { DropStatus } from "../enums/dropEnums";

const DropSchema: Schema = new Schema(
	{
		name: { type: String, required: true },
		description: { type: String },
		releaseDate: { type: Date, required: true },
		status: {
			type: String,
			enum: Object.values(DropStatus),
			required: true,
			default: DropStatus.Upcoming,
		},
		bannerImageUrl: { type: String, required: false },
	},
	{ timestamps: true },
);

const Drop = mongoose.model<DropInterface>("Drop", DropSchema);

export default Drop;
