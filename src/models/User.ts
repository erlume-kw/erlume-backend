// src/models/User.ts

import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "../interfaces/IUser"; // Import the IUser interface
import Seller from "./Seller";
// _id = user._id // This is the user_id --> auto generated in mongodb
// Create the User schema
const UserSchema: Schema = new Schema(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		emailAddress: { type: String, required: true, unique: true },
		phoneNumber: { type: String, required: true },
		address: { type: Object, required: true }, // Assuming IAddress is an object
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

// Create the User model
const User = mongoose.model<IUser>("User", UserSchema);

export default User;
