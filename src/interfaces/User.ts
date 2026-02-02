import { Document } from 'mongoose';
import { UserRole } from '../enums/userEnums';
import { AddressInterface } from './Address';

export interface UserInterface extends Document {
	// username?: string; // Deprecated: emailAddress is primary
	password: string;
	emailAddress: string;
	phoneNumber: string;
	address: AddressInterface;
	roles: UserRole[];
	cardIds: string[];
	isDeleted: boolean;
	createdAt: Date;
	updatedAt: Date;
}
