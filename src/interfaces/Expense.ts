import { Document, Types } from "mongoose";
import { ExpenseType } from "../enums/expenseEnums";

export interface ExpenseInterface extends Document {
	name: string; // Expense name/title (e.g. "September 2026 — Supplies")
	cost: string; // Expense cost (e.g. "6")
	currency?: string; // Format e.g. KWD (default KWD)
	employee_id?: Types.ObjectId; // Employee (ref User, optional)
	notes?: string; // Additional notes (e.g. "36 Packaging Bags")
	type: ExpenseType[]; // Type e.g. Supplies, Subscriptions, Services
	month: Date; // Month (e.g. September 2026)
	paidBy?: string; // Paid By (optional)
	isRecurring?: boolean; // Recurring? (optional)
	phase?: string; // Phase e.g. Pre-launch (optional)
	createdAt: Date;
	updatedAt: Date;
}
