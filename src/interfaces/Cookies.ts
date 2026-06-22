// src/interfaces/Cookies.ts

import { Document } from "mongoose";

export interface CookiesInterface extends Document {
	email?: string;
	ipAddress: string;
	userAgent?: string;
	accepted: boolean;
	consentedAt: Date;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}
