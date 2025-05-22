import { Document, Types } from "mongoose";
import { IAddress } from "./IAddress";
import { UserRole } from "../enums/userEnums";

export interface IUser extends Document {
	_id: Types.ObjectId; // User's own unique ID (auto by MongoDB)
	username: string;
	password: string;
	emailAddress: string;
	phoneNumber: string;
	address: IAddress;
	roles: UserRole[]; // Array of roles, e.g. ['Buyer'], ['Seller'], or both
	cardIds?: Types.ObjectId[]; // Array of references to CreditCard documents
	isDeleted: boolean;
}
