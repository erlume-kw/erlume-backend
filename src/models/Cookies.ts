// src/models/Cookies.ts

import mongoose, { Schema } from "mongoose";
import { CookiesInterface } from "../interfaces/Cookies";

const CookiesSchema: Schema = new Schema(
	{
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		ipAddress: {
			type: String,
			required: true,
		},
		userAgent: {
			type: String,
		},
		accepted: {
			type: Boolean,
			default: false,
		},
		consentedAt: { type: Date, default: Date.now },
		expiresAt: {
			type: Date,
			default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
		},
	},
	{ timestamps: true },
);

// Index for cleanup of expired records
CookiesSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cookies = mongoose.model<CookiesInterface>("Cookies", CookiesSchema);

export default Cookies;
