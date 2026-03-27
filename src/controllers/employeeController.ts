import { Request, Response } from "express";
import mongoose from "mongoose";
import Employee from "../models/Employee";

const getEmployees = async (req: Request, res: Response): Promise<void> => {
	try {
		const employees = await Employee.find({}).sort({ createdAt: -1 });
		res.status(200).json({
			success: true,
			data: employees,
			count: employees.length,
		});
	} catch (error) {
		console.error("Error in getEmployees:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getEmployeeById = async (req: Request, res: Response): Promise<void> => {
	try {
		const id = req.params.id;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, error: "Invalid employee ID" });
			return;
		}
		const employee = await Employee.findById(id).populate("user_id");
		if (!employee) {
			res.status(404).json({ success: false, error: "Employee not found" });
			return;
		}
		res.status(200).json({ success: true, data: employee });
	} catch (error) {
		console.error("Error in getEmployeeById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createEmployee = async (req: Request, res: Response): Promise<void> => {
	try {
		const { name, photo, role, type, salaryActual, salaryProjected, user_id } =
			req.body;

		if (!name) {
			res.status(400).json({
				success: false,
				error: "Missing required field: name",
			});
			return;
		}

		if (user_id && !mongoose.Types.ObjectId.isValid(user_id)) {
			res.status(400).json({ success: false, error: "Invalid user_id" });
			return;
		}

		const employee = new Employee({
			name,
			photo,
			role,
			type,
			salaryActual,
			salaryProjected,
			user_id: user_id || undefined,
		});

		const saved = await employee.save();

		res.status(201).json({
			success: true,
			message: "Employee created successfully",
			data: saved,
		});
	} catch (error: any) {
		console.error("Error in createEmployee:", error);
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

const updateEmployee = async (req: Request, res: Response): Promise<void> => {
	try {
		const id = req.params.id;
		const { name, photo, role, type, salaryActual, salaryProjected, user_id } =
			req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, error: "Invalid employee ID" });
			return;
		}

		const update: Record<string, unknown> = {};
		if (name !== undefined) update.name = name;
		if (photo !== undefined) update.photo = photo;
		if (role !== undefined) update.role = role;
		if (type !== undefined) update.type = type;
		if (salaryActual !== undefined) update.salaryActual = salaryActual;
		if (salaryProjected !== undefined) update.salaryProjected = salaryProjected;
		if (user_id !== undefined) {
			if (user_id === null || user_id === "") {
				update.user_id = undefined;
			} else {
				if (!mongoose.Types.ObjectId.isValid(user_id)) {
					res.status(400).json({ success: false, error: "Invalid user_id" });
					return;
				}
				update.user_id = user_id;
			}
		}

		const employee = await Employee.findByIdAndUpdate(
			id,
			{ $set: update },
			{ new: true, runValidators: true },
		).populate("user_id");

		if (!employee) {
			res.status(404).json({ success: false, error: "Employee not found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: "Employee updated successfully",
			data: employee,
		});
	} catch (error: any) {
		console.error("Error in updateEmployee:", error);
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

const deleteEmployee = async (req: Request, res: Response): Promise<void> => {
	try {
		const id = req.params.id;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, error: "Invalid employee ID" });
			return;
		}
		const employee = await Employee.findByIdAndDelete(id);
		if (!employee) {
			res.status(404).json({ success: false, error: "Employee not found" });
			return;
		}
		res.status(200).json({
			success: true,
			message: "Employee deleted successfully",
			data: { id },
		});
	} catch (error) {
		console.error("Error in deleteEmployee:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getEmployees,
	getEmployeeById,
	createEmployee,
	updateEmployee,
	deleteEmployee,
};
