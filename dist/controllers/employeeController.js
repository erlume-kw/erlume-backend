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
const Employee_1 = __importDefault(require("../models/Employee"));
const getEmployees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const employees = yield Employee_1.default.find({}).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: employees,
            count: employees.length,
        });
    }
    catch (error) {
        console.error("Error in getEmployees:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getEmployeeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, error: "Invalid employee ID" });
            return;
        }
        const employee = yield Employee_1.default.findById(id).populate("user_id");
        if (!employee) {
            res.status(404).json({ success: false, error: "Employee not found" });
            return;
        }
        res.status(200).json({ success: true, data: employee });
    }
    catch (error) {
        console.error("Error in getEmployeeById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, photo, role, type, salaryActual, salaryProjected, user_id } = req.body;
        if (!name) {
            res.status(400).json({
                success: false,
                error: "Missing required field: name",
            });
            return;
        }
        if (user_id && !mongoose_1.default.Types.ObjectId.isValid(user_id)) {
            res.status(400).json({ success: false, error: "Invalid user_id" });
            return;
        }
        const employee = new Employee_1.default({
            name,
            photo,
            role,
            type,
            salaryActual,
            salaryProjected,
            user_id: user_id || undefined,
        });
        const saved = yield employee.save();
        res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: saved,
        });
    }
    catch (error) {
        console.error("Error in createEmployee:", error);
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
const updateEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { name, photo, role, type, salaryActual, salaryProjected, user_id } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, error: "Invalid employee ID" });
            return;
        }
        const update = {};
        if (name !== undefined)
            update.name = name;
        if (photo !== undefined)
            update.photo = photo;
        if (role !== undefined)
            update.role = role;
        if (type !== undefined)
            update.type = type;
        if (salaryActual !== undefined)
            update.salaryActual = salaryActual;
        if (salaryProjected !== undefined)
            update.salaryProjected = salaryProjected;
        if (user_id !== undefined) {
            if (user_id === null || user_id === "") {
                update.user_id = undefined;
            }
            else {
                if (!mongoose_1.default.Types.ObjectId.isValid(user_id)) {
                    res.status(400).json({ success: false, error: "Invalid user_id" });
                    return;
                }
                update.user_id = user_id;
            }
        }
        const employee = yield Employee_1.default.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).populate("user_id");
        if (!employee) {
            res.status(404).json({ success: false, error: "Employee not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: employee,
        });
    }
    catch (error) {
        console.error("Error in updateEmployee:", error);
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
const deleteEmployee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, error: "Invalid employee ID" });
            return;
        }
        const employee = yield Employee_1.default.findByIdAndDelete(id);
        if (!employee) {
            res.status(404).json({ success: false, error: "Employee not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Employee deleted successfully",
            data: { id },
        });
    }
    catch (error) {
        console.error("Error in deleteEmployee:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
};
