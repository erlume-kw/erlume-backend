import mongoose, { Schema } from "mongoose";
import { ExpenseInterface } from "../interfaces/Expense";
import { ExpenseType } from "../enums/expenseEnums";

const ExpenseSchema: Schema = new Schema(
	{
		name: { type: String, required: true },
		cost: { type: String, required: true },
		currency: { type: String, required: false, default: "KWD" },
		employee_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: false,
			index: true,
		},
		notes: { type: String, required: false, default: "" },
		type: {
			type: [String],
			enum: Object.values(ExpenseType),
			required: true,
			default: [],
		},
		month: { type: Date, required: true, index: true },
		paidBy: { type: String, required: false },
		isRecurring: { type: Boolean, required: false, default: false },
		phase: { type: String, required: false },
	},
	{ timestamps: true },
);

const Expense = mongoose.model<ExpenseInterface>("Expense", ExpenseSchema);

export default Expense;
