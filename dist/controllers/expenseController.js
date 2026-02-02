"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Expense_1 = __importDefault(require("../models/Expense"));
const User_1 = __importDefault(require("../models/User"));
const expenseEnums_1 = require("../enums/expenseEnums");
const normalizeMonthDate = (value) => {
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
const getExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year } = req.query;
        const filter = {};
        if (month !== undefined || year !== undefined) {
            const monthNum = Number(month);
            const yearNum = Number(year);
            if (!Number.isInteger(monthNum) ||
                monthNum < 1 ||
                monthNum > 12 ||
                !Number.isInteger(yearNum) ||
                yearNum < 1970) {
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
        const expenses = yield Expense_1.default.find(filter).populate("employee_id");
        res.status(200).json({
            success: true,
            data: expenses,
            count: expenses.length,
        });
    }
    catch (error) {
        console.error("Error in getExpenses:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getExpenseById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expenseId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(expenseId)) {
            res.status(400).json({ success: false, error: "Invalid expense ID" });
            return;
        }
        const expense = yield Expense_1.default.findById(expenseId).populate("employee_id");
        if (!expense) {
            res.status(404).json({ success: false, error: "Expense not found" });
            return;
        }
        res.status(200).json({ success: true, data: expense });
    }
    catch (error) {
        console.error("Error in getExpenseById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, cost, currency, employee_id, notes, type, month, paidBy, isRecurring, phase, } = req.body;
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
            const invalidTypes = type.filter((value) => !Object.values(expenseEnums_1.ExpenseType).includes(value));
            if (invalidTypes.length > 0) {
                res.status(400).json({
                    success: false,
                    error: `Invalid type. Must be one of: ${Object.values(expenseEnums_1.ExpenseType).join(", ")}`,
                });
                return;
            }
        }
        if (employee_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(employee_id)) {
                res.status(400).json({ success: false, error: "Invalid employee_id" });
                return;
            }
            const employee = yield User_1.default.findById(employee_id);
            if (!employee) {
                res.status(404).json({ success: false, error: "Employee not found" });
                return;
            }
        }
        const newExpense = new Expense_1.default({
            name,
            cost,
            currency: currency !== null && currency !== void 0 ? currency : "KWD",
            employee_id: employee_id || undefined,
            notes: notes !== null && notes !== void 0 ? notes : "",
            type: Array.isArray(type) ? type : [],
            month: normalizedMonth,
            paidBy: paidBy !== null && paidBy !== void 0 ? paidBy : undefined,
            isRecurring: isRecurring === true || isRecurring === "true",
            phase: phase !== null && phase !== void 0 ? phase : undefined,
        });
        const savedExpense = yield newExpense.save();
        res.status(201).json({
            success: true,
            message: "Expense created successfully",
            data: savedExpense,
        });
    }
    catch (error) {
        console.error("Error in createExpense:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: errors,
            });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const updateExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expenseId = req.params.id;
        const { name, cost, currency, employee_id, notes, type, month, paidBy, isRecurring, phase, } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(expenseId)) {
            res.status(400).json({ success: false, error: "Invalid expense ID" });
            return;
        }
        const expense = yield Expense_1.default.findById(expenseId);
        if (!expense) {
            res.status(404).json({ success: false, error: "Expense not found" });
            return;
        }
        const update = {};
        if (name !== undefined)
            update.name = name;
        if (cost !== undefined)
            update.cost = cost;
        if (currency !== undefined)
            update.currency = currency;
        if (notes !== undefined)
            update.notes = notes;
        if (paidBy !== undefined)
            update.paidBy = paidBy;
        if (isRecurring !== undefined)
            update.isRecurring = isRecurring === true || isRecurring === "true";
        if (phase !== undefined)
            update.phase = phase;
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
            const invalidTypes = type.filter((value) => !Object.values(expenseEnums_1.ExpenseType).includes(value));
            if (invalidTypes.length > 0) {
                res.status(400).json({
                    success: false,
                    error: `Invalid type. Must be one of: ${Object.values(expenseEnums_1.ExpenseType).join(", ")}`,
                });
                return;
            }
            update.type = type;
        }
        if (employee_id !== undefined) {
            if (employee_id === null || employee_id === "") {
                update.employee_id = null;
            }
            else {
                if (!mongoose_1.default.Types.ObjectId.isValid(employee_id)) {
                    res
                        .status(400)
                        .json({ success: false, error: "Invalid employee_id" });
                    return;
                }
                const employee = yield User_1.default.findById(employee_id);
                if (!employee) {
                    res.status(404).json({ success: false, error: "Employee not found" });
                    return;
                }
                update.employee_id = employee_id;
            }
        }
        const updatedExpense = yield Expense_1.default.findByIdAndUpdate(expenseId, { $set: update }, { new: true, runValidators: true }).populate("employee_id");
        res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            data: updatedExpense,
        });
    }
    catch (error) {
        console.error("Error in updateExpense:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: errors,
            });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const deleteExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expenseId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(expenseId)) {
            res.status(400).json({ success: false, error: "Invalid expense ID" });
            return;
        }
        const expense = yield Expense_1.default.findById(expenseId);
        if (!expense) {
            res.status(404).json({ success: false, error: "Expense not found" });
            return;
        }
        yield Expense_1.default.findByIdAndDelete(expenseId);
        res.status(200).json({
            success: true,
            message: "Expense deleted successfully",
            data: { id: expenseId },
        });
    }
    catch (error) {
        console.error("Error in deleteExpense:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
};
