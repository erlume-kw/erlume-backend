import { Request, Response } from "express";
import mongoose from "mongoose";
import Expense from "../models/Expense";
import User from "../models/User";
import { ExpenseType } from "../enums/expenseEnums";

const normalizeMonthDate = (value: unknown): Date | null => {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return new Date(value.getFullYear(), value.getMonth(), 1);
	}

	if (typeof value === "string" || typeof value === "number") {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) {
			return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
		}
	}

	return null;
};

const getExpenses = async (req: Request, res: Response): Promise<void> => {
	try {
		const { month, year } = req.query;
		const filter: Record<string, unknown> = {};

		if (month !== undefined || year !== undefined) {
			const monthNum = Number(month);
			const yearNum = Number(year);

			if (
				!Number.isInteger(monthNum) ||
				monthNum < 1 ||
				monthNum > 12 ||
				!Number.isInteger(yearNum) ||
				yearNum < 1970
			) {
				res.status(400).json({
					success: false,
					error: "Invalid month/year. Provide month (1-12) and year.",
				});
				return;
			}

			const start = new Date(yearNum, monthNum - 1, 1);
			const end = new Date(yearNum, monthNum, 1);
			filter.month = { $gte: start, $lt: end };
		}

		const expenses = await Expense.find(filter).populate("employee_id");
		res.status(200).json({
			success: true,
			data: expenses,
			count: expenses.length,
		});
	} catch (error) {
		console.error("Error in getExpenses:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getExpenseById = async (req: Request, res: Response): Promise<void> => {
	try {
		const expenseId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(expenseId)) {
			res.status(400).json({ success: false, error: "Invalid expense ID" });
			return;
		}

		const expense = await Expense.findById(expenseId).populate("employee_id");
		if (!expense) {
			res.status(404).json({ success: false, error: "Expense not found" });
			return;
		}

		res.status(200).json({ success: true, data: expense });
	} catch (error) {
		console.error("Error in getExpenseById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createExpense = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			name,
			cost,
			currency,
			employee_id,
			notes,
			type,
			month,
			paidBy,
			isRecurring,
			phase,
		} = req.body;

		if (!name || !cost || !month) {
			res.status(400).json({
				success: false,
				error: "Missing required fields: name, cost, month",
			});
			return;
		}

		const normalizedMonth = normalizeMonthDate(month);
		if (!normalizedMonth) {
			res.status(400).json({
				success: false,
				error: "Invalid month. Use a valid date string or timestamp.",
			});
			return;
		}

		if (type !== undefined && !Array.isArray(type)) {
			res.status(400).json({
				success: false,
				error: "type must be an array of strings",
			});
			return;
		}
		if (Array.isArray(type)) {
			const invalidTypes = type.filter(
				(value) => !Object.values(ExpenseType).includes(value),
			);
			if (invalidTypes.length > 0) {
				res.status(400).json({
					success: false,
					error: `Invalid type. Must be one of: ${Object.values(
						ExpenseType,
					).join(", ")}`,
				});
				return;
			}
		}

		if (employee_id) {
			if (!mongoose.Types.ObjectId.isValid(employee_id)) {
				res.status(400).json({ success: false, error: "Invalid employee_id" });
				return;
			}

			const employee = await User.findById(employee_id);
			if (!employee) {
				res.status(404).json({ success: false, error: "Employee not found" });
				return;
			}
		}

		const newExpense = new Expense({
			name,
			cost,
			currency: currency ?? "KWD",
			employee_id: employee_id || undefined,
			notes: notes ?? "",
			type: Array.isArray(type) ? type : [],
			month: normalizedMonth,
			paidBy: paidBy ?? undefined,
			isRecurring: isRecurring === true || isRecurring === "true",
			phase: phase ?? undefined,
		});

		const savedExpense = await newExpense.save();

		res.status(201).json({
			success: true,
			message: "Expense created successfully",
			data: savedExpense,
		});
	} catch (error: any) {
		console.error("Error in createExpense:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const updateExpense = async (req: Request, res: Response): Promise<void> => {
	try {
		const expenseId = req.params.id;
		const {
			name,
			cost,
			currency,
			employee_id,
			notes,
			type,
			month,
			paidBy,
			isRecurring,
			phase,
		} = req.body;

		if (!mongoose.Types.ObjectId.isValid(expenseId)) {
			res.status(400).json({ success: false, error: "Invalid expense ID" });
			return;
		}

		const expense = await Expense.findById(expenseId);
		if (!expense) {
			res.status(404).json({ success: false, error: "Expense not found" });
			return;
		}

		const update: any = {};

		if (name !== undefined) update.name = name;
		if (cost !== undefined) update.cost = cost;
		if (currency !== undefined) update.currency = currency;
		if (notes !== undefined) update.notes = notes;
		if (paidBy !== undefined) update.paidBy = paidBy;
		if (isRecurring !== undefined)
			update.isRecurring = isRecurring === true || isRecurring === "true";
		if (phase !== undefined) update.phase = phase;
		if (month !== undefined) {
			const normalizedMonth = normalizeMonthDate(month);
			if (!normalizedMonth) {
				res.status(400).json({
					success: false,
					error: "Invalid month. Use a valid date string or timestamp.",
				});
				return;
			}
			update.month = normalizedMonth;
		}

		if (type !== undefined) {
			if (!Array.isArray(type)) {
				res.status(400).json({
					success: false,
					error: "type must be an array of strings",
				});
				return;
			}
			const invalidTypes = type.filter(
				(value) => !Object.values(ExpenseType).includes(value),
			);
			if (invalidTypes.length > 0) {
				res.status(400).json({
					success: false,
					error: `Invalid type. Must be one of: ${Object.values(
						ExpenseType,
					).join(", ")}`,
				});
				return;
			}
			update.type = type;
		}

		if (employee_id !== undefined) {
			if (employee_id === null || employee_id === "") {
				update.employee_id = null;
			} else {
				if (!mongoose.Types.ObjectId.isValid(employee_id)) {
					res
						.status(400)
						.json({ success: false, error: "Invalid employee_id" });
					return;
				}

				const employee = await User.findById(employee_id);
				if (!employee) {
					res.status(404).json({ success: false, error: "Employee not found" });
					return;
				}
				update.employee_id = employee_id;
			}
		}

		const updatedExpense = await Expense.findByIdAndUpdate(
			expenseId,
			{ $set: update },
			{ new: true, runValidators: true },
		).populate("employee_id");

		res.status(200).json({
			success: true,
			message: "Expense updated successfully",
			data: updatedExpense,
		});
	} catch (error: any) {
		console.error("Error in updateExpense:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const deleteExpense = async (req: Request, res: Response): Promise<void> => {
	try {
		const expenseId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(expenseId)) {
			res.status(400).json({ success: false, error: "Invalid expense ID" });
			return;
		}

		const expense = await Expense.findById(expenseId);
		if (!expense) {
			res.status(404).json({ success: false, error: "Expense not found" });
			return;
		}

		await Expense.findByIdAndDelete(expenseId);

		res.status(200).json({
			success: true,
			message: "Expense deleted successfully",
			data: { id: expenseId },
		});
	} catch (error) {
		console.error("Error in deleteExpense:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getExpenses,
	getExpenseById,
	createExpense,
	updateExpense,
	deleteExpense,
};
