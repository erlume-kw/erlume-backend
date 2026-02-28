import mongoose, { Schema } from "mongoose";
import { EmployeeInterface } from "../interfaces/Employee";

const EmployeeSchema: Schema = new Schema(
	{
		name: { type: String, required: true },
		photo: { type: String, required: false },
		role: { type: String, required: false },
		type: { type: String, required: false },
		salaryActual: { type: String, required: false },
		salaryProjected: { type: String, required: false },
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: false,
			index: true,
		},
	},
	{ timestamps: true },
);

const Employee = mongoose.model<EmployeeInterface>("Employee", EmployeeSchema);

export default Employee;
