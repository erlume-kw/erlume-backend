import { Document, Types } from "mongoose";
import { DropStatus } from "../enums/dropEnums";

export interface DropInterface extends Document {
	name: string; // Drop name/title
	description?: string; // Optional description
	releaseDate: Date; // When the drop is released/launched
	status: DropStatus; // Drop status
	createdAt: Date;
	updatedAt: Date;
}
