import { Document, Types } from "mongoose";

export interface CreditCardInterface extends Document {
	_id: Types.ObjectId; // Card's unique ID (MongoDB ObjectId)
	cardNumber: string; // Card number
	expiryDate: string; // Expiry date of the card
	holderName: string; // Name of the cardholder
}
