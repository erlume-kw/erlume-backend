// src/models/Seller.ts
import mongoose, { Schema } from "mongoose";
import { SellerInterface } from "../interfaces/Seller";
import { EscalationStatus } from "../enums/flowEnums";

// Create the Seller schema
const SellerSchema: Schema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
			index: true,
		},
		fullName: { type: String, required: false, default: "" },
		emailAddress: {
			type: String,
			required: false,
			match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		},
		phoneNumber: {
			type: String,
			required: false,
			match: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
		},
		addressText: { type: String, required: false, default: "" },
		balance: { type: String, required: true },
		itemIds: {
			type: [Schema.Types.ObjectId],
			ref: "Item",
			default: [],
		},
		IBAN: { type: String, required: false },
		qrCode: { type: String, required: false },
		isDeactivated: { type: Boolean, default: false },
		consentGiven: { type: Boolean, default: false, required: false },
		preferredPickupDate: { type: String, default: "", required: false },
		intakeTimestamp: { type: String, required: false },
		sellerPolicyAcceptedAt: { type: Date, required: false },
		escalationStatus: {
			type: String,
			enum: Object.values(EscalationStatus),
			required: false,
		},
		escalationNotes: { type: String, required: false },
	},
	{ timestamps: true },
); // Automatically manage createdAt and updatedAt

// Create the Seller model
const Seller = mongoose.model<SellerInterface>("Seller", SellerSchema);

export default Seller;
