// src/models/Newsletter.ts

import mongoose, { Schema } from "mongoose";
import { NewsletterInterface } from "../interfaces/Newsletter";

const NewsletterSchema: Schema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
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

const Newsletter = mongoose.model<NewsletterInterface>("Newsletter", NewsletterSchema);

export default Newsletter;
