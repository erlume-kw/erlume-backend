import { Document, Types } from "mongoose";
import { DropStatus } from "../enums/dropEnums";

export interface DropInterface extends Document {
	name: string; // Drop name/title
	description?: string; // Optional description
	releaseDate: Date; // When the drop is released/launched
	status: DropStatus; // Drop status
	bannerImageUrl?: string; // Hero/cover image shown on the drop page
	createdAt: Date;
	updatedAt: Date;
}
