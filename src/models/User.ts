// src/models/User.ts

import mongoose, { Schema, Document } from "mongoose";
import { UserInterface } from "../interfaces/User"; // Import the UserInterface
import Seller from "./Seller";
import { AddressSchema } from "./Address";
// _id = user._id // This is the user_id --> auto generated in mongodb
// Create the User schema
const UserSchema: Schema = new Schema(
	{
		// username: { type: String, required: true }, // Deprecated: emailAddress is primary
		password: { type: String, required: true },
		emailAddress: {
			type: String,
			required: true,
			match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		},
		phoneNumber: {
			type: String,
			required: true,
			match: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
		},
		address: { type: AddressSchema, required: true }, // Assuming IAddress is an object
		roles: [{ type: String, required: true }], // Array of roles
		cardIds: [{ type: Schema.Types.ObjectId, ref: "CreditCard" }],
		isDeleted: { type: Boolean, default: false },
	},
	{ timestamps: true },
); // Automatically manage createdAt and updatedAt

// Cascade delete Seller when a User is deleted
UserSchema.pre("findOneAndDelete", async function (next) {
	const doc = await this.model.findOne(this.getFilter());
	if (doc) {
		await Seller.deleteOne({ userId: doc._id });
	}
	next();
});

// Create partial unique indexes that only apply to non-deleted users
// This allows deleted users to exist without blocking new users with the same email
UserSchema.index(
	{ emailAddress: 1 },
	{
		unique: true,
		partialFilterExpression: { isDeleted: false },
		name: "emailAddress_unique_not_deleted",
	},
);

// Create the User model
const User = mongoose.model<UserInterface>("User", UserSchema);

export default User;
