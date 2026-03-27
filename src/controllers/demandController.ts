import { Request, Response } from "express";
import Demand from "../models/Demand";
import SubCategory from "../models/SubCategory";
import mongoose from "mongoose";

const getDemands = async (req: Request, res: Response): Promise<void> => {
	try {
		const demands = await Demand.find({});
		res.status(200).json({
			success: true,
			data: demands,
			count: demands.length,
		});
	} catch (error) {
		console.error("Error in getDemands:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getDemandsBySubCategoryId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const subCategoryId = req.params.subCategoryId;

		// Validate subcategory ID
		if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
			res.status(400).json({ success: false, error: "Invalid subcategory ID" });
			return;
		}

		// Find subcategory to get its demand_id
		const subCategory = await SubCategory.findById(subCategoryId);
		if (!subCategory) {
			res.status(404).json({ success: false, error: "Subcategory not found" });
			return;
		}

		// If subcategory has a demand_id, get that demand
		if (subCategory.demand_id) {
			const demand = await Demand.findById(subCategory.demand_id);
			if (demand) {
				res.status(200).json({
					success: true,
					data: [demand],
					count: 1,
				});
				return;
			}
		}

		// If no demand_id, return empty array
		res.status(200).json({
			success: true,
			data: [],
			count: 0,
			message: "Subcategory has no associated demand",
		});
	} catch (error) {
		console.error("Error in getDemandsBySubCategoryId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getDemandById = async (req: Request, res: Response): Promise<void> => {
	try {
		const demandId = req.params.id;

		// Validate demand ID
		if (!mongoose.Types.ObjectId.isValid(demandId)) {
			res.status(400).json({ success: false, error: "Invalid demand ID" });
			return;
		}

		// Find demand by ID
		const demand = await Demand.findById(demandId);

		if (!demand) {
			res.status(404).json({ success: false, error: "Demand not found" });
			return;
		}

		res.status(200).json({ success: true, data: demand });
	} catch (error) {
		console.error("Error in getDemandById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createDemand = async (req: Request, res: Response): Promise<void> => {
	try {
		const { demand_name, demand_rate } = req.body;

		// Validate required fields
		if (!demand_name) {
			res.status(400).json({
				success: false,
				error: "demand_name is required",
			});
			return;
		}

		// Create new demand
		const newDemand = new Demand({
			demand_name,
			demand_rate: demand_rate || undefined,
		});

		const savedDemand = await newDemand.save();

		res.status(201).json({
			success: true,
			message: "Demand created successfully",
			data: savedDemand,
		});
	} catch (error) {
		console.error("Error in createDemand:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const updateDemand = async (req: Request, res: Response): Promise<void> => {
	try {
		const demandId = req.params.id;
		const updatedData = req.body;

		// Validate demand ID
		if (!mongoose.Types.ObjectId.isValid(demandId)) {
			res.status(400).json({ success: false, error: "Invalid demand ID" });
			return;
		}

		// Check if demand exists
		const demand = await Demand.findById(demandId);
		if (!demand) {
			res.status(404).json({ success: false, error: "Demand not found" });
			return;
		}

		// Update demand
		const updatedDemand = await Demand.findByIdAndUpdate(
			demandId,
			updatedData,
			{ new: true, runValidators: true },
		);

		res.status(200).json({
			success: true,
			message: "Demand updated successfully",
			data: updatedDemand,
		});
	} catch (error) {
		console.error("Error in updateDemand:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const deleteDemand = async (req: Request, res: Response): Promise<void> => {
	try {
		const demandId = req.params.id;

		// Validate demand ID
		if (!mongoose.Types.ObjectId.isValid(demandId)) {
			res.status(400).json({ success: false, error: "Invalid demand ID" });
			return;
		}

		// Check if demand exists
		const demand = await Demand.findById(demandId);
		if (!demand) {
			res.status(404).json({ success: false, error: "Demand not found" });
			return;
		}

		// Delete demand
		await Demand.findByIdAndDelete(demandId);

		res.status(200).json({
			success: true,
			message: "Demand deleted successfully",
			data: { id: demandId },
		});
	} catch (error) {
		console.error("Error in deleteDemand:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getDemands,
	getDemandsBySubCategoryId,
	getDemandById,
	createDemand,
	updateDemand,
	deleteDemand,
};
