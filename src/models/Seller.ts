// src/models/Seller.ts
import mongoose, { Schema } from "mongoose";
import { ISeller } from "../interfaces/ISeller"; // Import the ISeller interface

// Create the Seller schema
const SellerSchema: Schema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		}, // Reference to User
		balance: { type: String, required: true },
		itemIds: [{ type: Schema.Types.ObjectId, ref: "Item", required: true }], // List of ObjectIds referencing items
		IBAN: { type: String, required: true },
		qrCode: { type: String, required: true },
		isDeactivated: { type: Boolean, default: false },
	},
	{ timestamps: true },
); // Automatically manage createdAt and updatedAt

// Create the Seller model
const Seller = mongoose.model<ISeller>("Seller", SellerSchema);

export default Seller;
