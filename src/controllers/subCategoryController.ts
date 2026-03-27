import { Request, Response } from "express";
import SubCategory from "../models/SubCategory";
import Category from "../models/Category";
import mongoose from "mongoose";

const getSubCategories = async (req: Request, res: Response): Promise<void> => {
	try {
		const subCategories = await SubCategory.find({});
		res.status(200).json({
			success: true,
			data: subCategories,
			count: subCategories.length,
		});
	} catch (error) {
		console.error("Error in getSubCategories:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getSubCategoriesByCategoryId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const categoryId = req.params.categoryId;

		// Validate category ID
		if (!mongoose.Types.ObjectId.isValid(categoryId)) {
			res.status(400).json({ success: false, error: "Invalid category ID" });
			return;
		}

		const subCategories = await SubCategory.find({ category_id: categoryId });
		res.status(200).json({
			success: true,
			data: subCategories,
			count: subCategories.length,
		});
	} catch (error) {
		console.error("Error in getSubCategoriesByCategoryId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getSubCategoryById = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const subCategoryId = req.params.id;

		// Validate subcategory ID
		if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
			res.status(400).json({ success: false, error: "Invalid subcategory ID" });
			return;
		}

		const subCategory = await SubCategory.findById(subCategoryId);

		if (!subCategory) {
			res.status(404).json({ success: false, error: "Subcategory not found" });
			return;
		}

		res.status(200).json({ success: true, data: subCategory });
	} catch (error) {
		console.error("Error in getSubCategoryById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createSubCategory = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { sub_cat_name, category_id, demand_id, sub_clean_rate } = req.body;

		// Validate required fields
		if (!sub_cat_name || !category_id) {
			res.status(400).json({
				success: false,
				error: "sub_cat_name and category_id are required",
			});
			return;
		}

		// Validate category_id
		if (!mongoose.Types.ObjectId.isValid(category_id)) {
			res.status(400).json({ success: false, error: "Invalid category ID" });
			return;
		}
		const category = await Category.findById(category_id);
		if (!category) {
			res.status(404).json({ success: false, error: "Category not found" });
			return;
		}

		// Validate demand_id if provided
		if (demand_id && !mongoose.Types.ObjectId.isValid(demand_id)) {
			res.status(400).json({ success: false, error: "Invalid demand ID" });
			return;
		}

		// Create new subcategory
		const newSubCategory = new SubCategory({
			sub_cat_name,
			category_id,
			demand_id: demand_id || undefined,
			sub_clean_rate: sub_clean_rate || undefined,
		});

		const savedSubCategory = await newSubCategory.save();

		res.status(201).json({
			success: true,
			message: "SubCategory created successfully",
			data: savedSubCategory,
		});
	} catch (error) {
		console.error("Error in createSubCategory:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const updateSubCategory = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const subCategoryId = req.params.id;
		const updatedData = req.body;

		// Validate subcategory ID
		if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
			res.status(400).json({ success: false, error: "Invalid subcategory ID" });
			return;
		}

		// Validate category_id if provided
		if (
			updatedData.category_id &&
			!mongoose.Types.ObjectId.isValid(updatedData.category_id)
		) {
			res.status(400).json({ success: false, error: "Invalid category ID" });
			return;
		}
		if (updatedData.category_id) {
			const category = await Category.findById(updatedData.category_id);
			if (!category) {
				res.status(404).json({ success: false, error: "Category not found" });
				return;
			}
		}

		// Validate demand_id if provided
		if (
			updatedData.demand_id &&
			!mongoose.Types.ObjectId.isValid(updatedData.demand_id)
		) {
			res.status(400).json({ success: false, error: "Invalid demand ID" });
			return;
		}

		// Check if subcategory exists
		const subCategory = await SubCategory.findById(subCategoryId);
		if (!subCategory) {
			res.status(404).json({ success: false, error: "Subcategory not found" });
			return;
		}

		// Update subcategory
		const updatedSubCategory = await SubCategory.findByIdAndUpdate(
			subCategoryId,
			updatedData,
			{ new: true, runValidators: true },
		);

		res.status(200).json({
			success: true,
			message: "SubCategory updated successfully",
			data: updatedSubCategory,
		});
	} catch (error) {
		console.error("Error in updateSubCategory:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const deleteSubCategory = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const subCategoryId = req.params.id;

		// Validate subcategory ID
		if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
			res.status(400).json({ success: false, error: "Invalid subcategory ID" });
			return;
		}

		// Check if subcategory exists
		const subCategory = await SubCategory.findById(subCategoryId);
		if (!subCategory) {
			res.status(404).json({ success: false, error: "Subcategory not found" });
			return;
		}

		// Delete subcategory
		await SubCategory.findByIdAndDelete(subCategoryId);

		res.status(200).json({
			success: true,
			message: "SubCategory deleted successfully",
			data: { id: subCategoryId },
		});
	} catch (error) {
		console.error("Error in deleteSubCategory:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getSubCategories,
	getSubCategoriesByCategoryId,
	getSubCategoryById,
	createSubCategory,
	updateSubCategory,
	deleteSubCategory,
};
