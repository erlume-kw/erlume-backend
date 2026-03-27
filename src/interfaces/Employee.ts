import { Document, Types } from "mongoose";

export interface EmployeeInterface extends Document {
	name: string;
	photo?: string;
	role?: string;
	type?: string; // e.g. full-time, part-time
	salaryActual?: string;
	salaryProjected?: string;
	user_id?: Types.ObjectId; // Optional link to User
	createdAt: Date;
	updatedAt: Date;
}
