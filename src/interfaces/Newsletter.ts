// src/interfaces/Newsletter.ts

import { Document } from "mongoose";

export interface NewsletterInterface extends Document {
	email: string;
	subscribedAt: Date;
	isActive: boolean; // false = unsubscribed but kept for audit
}
