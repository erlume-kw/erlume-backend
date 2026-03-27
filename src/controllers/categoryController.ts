import { Request, Response } from "express";
import Category from "../models/Category";
import SubCategory from "../models/SubCategory";
import mongoose from "mongoose";

const getCategories = async (req: Request, res: Response): Promise<void> => {
	try {
		const categories = await Category.find({});
		res
			.status(200)
			.json({ success: true, data: categories, count: categories.length });
	} catch (error) {
		console.error("Error in getCategories:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getCategoryById = async (req: Request, res: Response): Promise<void> => {
	try {
		const categoryId = req.params.id;

		// Validate category ID
		if (!mongoose.Types.ObjectId.isValid(categoryId)) {
			res.status(400).json({ success: false, error: "Invalid category ID" });
			return;
		}

		// Find category by ID
		const category = await Category.findById(categoryId);

		if (!category) {
			res.status(404).json({ success: false, error: "Category not found" });
			return;
		}

		res.status(200).json({ success: true, data: category });
	} catch (error) {
		console.error("Error in getCategoryById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createCategory = async (req: Request, res: Response): Promise<void> => {
	try {
		const { name, base_rate, op_rate, clean_rate, sub_category_id } = req.body;

		// Validate required fields
		if (!name || !base_rate) {
			res.status(400).json({
				success: false,
				error: "name and base_rate are required",
			});
			return;
		}

		// Validate sub_category_id if provided
		if (sub_category_id) {
			if (!mongoose.Types.ObjectId.isValid(sub_category_id)) {
				res.status(400).json({
					success: false,
					error: "Invalid sub_category_id",
				});
				return;
			}

			const subCategory = await SubCategory.findById(sub_category_id);
			if (!subCategory) {
				res.status(404).json({
					success: false,
					error: "SubCategory not found",
				});
				return;
			}
		}

		const newCategory = new Category({
			name,
			base_rate,
			op_rate: op_rate || undefined,
			clean_rate: clean_rate || undefined,
			sub_category_id: sub_category_id || undefined,
		});

		const savedCategory = await newCategory.save();

		res.status(201).json({
			success: true,
			message: "Category created successfully",
			data: savedCategory,
		});
	} catch (error: any) {
		console.error("Error in createCategory:", error);
		
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

const updateCategory = async (req: Request, res: Response): Promise<void> => {
	try {
		const categoryId = req.params.id;
		const updatedData = req.body;

		// Validate category ID
		if (!mongoose.Types.ObjectId.isValid(categoryId)) {
			res.status(400).json({ success: false, error: "Invalid category ID" });
			return;
		}

		// Check if category exists
		const category = await Category.findById(categoryId);
		if (!category) {
			res.status(404).json({ success: false, error: "Category not found" });
			return;
		}

		// Validate sub_category_id if provided
		if (updatedData.sub_category_id) {
			if (!mongoose.Types.ObjectId.isValid(updatedData.sub_category_id)) {
				res.status(400).json({
					success: false,
					error: "Invalid sub_category_id",
				});
				return;
			}

			const subCategory = await SubCategory.findById(
				updatedData.sub_category_id,
			);
			if (!subCategory) {
				res.status(404).json({
					success: false,
					error: "SubCategory not found",
				});
				return;
			}
		}

		const updatedCategory = await Category.findByIdAndUpdate(
			categoryId,
			updatedData,
			{ new: true, runValidators: true },
		);

		res.status(200).json({
			success: true,
			message: "Category updated successfully",
			data: updatedCategory,
		});
	} catch (error: any) {
		console.error("Error in updateCategory:", error);
		
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

const deleteCategory = async (req: Request, res: Response): Promise<void> => {
	try {
		const categoryId = req.params.id;

		// Validate category ID
		if (!mongoose.Types.ObjectId.isValid(categoryId)) {
			res.status(400).json({ success: false, error: "Invalid category ID" });
			return;
		}

		// Check if category exists
		const category = await Category.findById(categoryId);
		if (!category) {
			res.status(404).json({ success: false, error: "Category not found" });
			return;
		}

		// Delete category (this will trigger cascade delete of SubCategories via pre-hook)
		await Category.findByIdAndDelete(categoryId);

		res.status(200).json({
			success: true,
			message: "Category deleted successfully",
			data: { id: categoryId },
		});
	} catch (error) {
		console.error("Error in deleteCategory:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getCategories,
	getCategoryById,
	createCategory,
	updateCategory,
	deleteCategory,
};
