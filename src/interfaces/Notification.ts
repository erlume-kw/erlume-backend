// src/interfaces/Notification.ts

import { Document } from "mongoose";

export interface NotificationInterface extends Document {
	email: string;
	itemId: string;
	itemName: string;
	brandName: string;
	subscribedAt: Date;
	isActive: boolean;
	verificationStatus: "pending" | "valid" | "invalid";
	verifiedAt: Date | null;
	verifialiaDiagnostics: string | null;
}
