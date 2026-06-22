// src/models/Notification.ts

import mongoose, { Schema } from "mongoose";
import { NotificationInterface } from "../interfaces/Notification";

const NotificationSchema: Schema = new Schema(
	{
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
		},
		itemId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "Item",
		},
		itemName: {
			type: String,
			required: true,
		},
		brandName: {
			type: String,
			required: true,
		},
		subscribedAt: { type: Date, default: Date.now },
		isActive: { type: Boolean, default: true },
		verificationStatus: {
			type: String,
			enum: ["pending", "valid", "invalid"],
			default: "pending",
		},
		verifiedAt: { type: Date, default: null },
		verifialiaDiagnostics: { type: String, default: null },
	},
	{ timestamps: true },
);

// Compound unique index: email + itemId (only one notification per email per item)
NotificationSchema.index({ email: 1, itemId: 1 }, { unique: true });

const Notification = mongoose.model<NotificationInterface>("Notification", NotificationSchema);

export default Notification;
