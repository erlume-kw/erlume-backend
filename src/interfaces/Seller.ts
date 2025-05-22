import { Document, Types } from "mongoose";

export interface SellerInterface extends Document {
	userId: Types.ObjectId; // Reference to the User
	balance: string; // Seller's balance
	itemIds: Types.ObjectId[]; // List of ObjectIds referencing the items listed by the seller
	IBAN: string; // International Bank Account Number
	qrCode: string; // QR code for payments
	isDeactivated: boolean; // Indicates if the seller account is deactivated
	createdAt: Date;
	updatedAt: Date;
}
