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
const SubCategory_1 = __importDefault(require("../models/SubCategory"));
const Category_1 = __importDefault(require("../models/Category"));
const mongoose_1 = __importDefault(require("mongoose"));
const getSubCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subCategories = yield SubCategory_1.default.find({});
        res.status(200).json({
            success: true,
            data: subCategories,
            count: subCategories.length,
        });
    }
    catch (error) {
        console.error("Error in getSubCategories:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getSubCategoriesByCategoryId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.categoryId;
        // Validate category ID
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            res.status(400).json({ success: false, error: "Invalid category ID" });
            return;
        }
        const subCategories = yield SubCategory_1.default.find({ category_id: categoryId });
        res.status(200).json({
            success: true,
            data: subCategories,
            count: subCategories.length,
        });
    }
    catch (error) {
        console.error("Error in getSubCategoriesByCategoryId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getSubCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subCategoryId = req.params.id;
        // Validate subcategory ID
        if (!mongoose_1.default.Types.ObjectId.isValid(subCategoryId)) {
            res.status(400).json({ success: false, error: "Invalid subcategory ID" });
            return;
        }
        const subCategory = yield SubCategory_1.default.findById(subCategoryId);
        if (!subCategory) {
            res.status(404).json({ success: false, error: "Subcategory not found" });
            return;
        }
        res.status(200).json({ success: true, data: subCategory });
    }
    catch (error) {
        console.error("Error in getSubCategoryById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createSubCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!mongoose_1.default.Types.ObjectId.isValid(category_id)) {
            res.status(400).json({ success: false, error: "Invalid category ID" });
            return;
        }
        const category = yield Category_1.default.findById(category_id);
        if (!category) {
            res.status(404).json({ success: false, error: "Category not found" });
            return;
        }
        // Validate demand_id if provided
        if (demand_id && !mongoose_1.default.Types.ObjectId.isValid(demand_id)) {
            res.status(400).json({ success: false, error: "Invalid demand ID" });
            return;
        }
        // Create new subcategory
        const newSubCategory = new SubCategory_1.default({
            sub_cat_name,
            category_id,
            demand_id: demand_id || undefined,
            sub_clean_rate: sub_clean_rate || undefined,
        });
        const savedSubCategory = yield newSubCategory.save();
        res.status(201).json({
            success: true,
            message: "SubCategory created successfully",
            data: savedSubCategory,
        });
    }
    catch (error) {
        console.error("Error in createSubCategory:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const updateSubCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subCategoryId = req.params.id;
        const updatedData = req.body;
        // Validate subcategory ID
        if (!mongoose_1.default.Types.ObjectId.isValid(subCategoryId)) {
            res.status(400).json({ success: false, error: "Invalid subcategory ID" });
            return;
        }
        // Validate category_id if provided
        if (updatedData.category_id &&
            !mongoose_1.default.Types.ObjectId.isValid(updatedData.category_id)) {
            res.status(400).json({ success: false, error: "Invalid category ID" });
            return;
        }
        if (updatedData.category_id) {
            const category = yield Category_1.default.findById(updatedData.category_id);
            if (!category) {
                res.status(404).json({ success: false, error: "Category not found" });
                return;
            }
        }
        // Validate demand_id if provided
        if (updatedData.demand_id &&
            !mongoose_1.default.Types.ObjectId.isValid(updatedData.demand_id)) {
            res.status(400).json({ success: false, error: "Invalid demand ID" });
            return;
        }
        // Check if subcategory exists
        const subCategory = yield SubCategory_1.default.findById(subCategoryId);
        if (!subCategory) {
            res.status(404).json({ success: false, error: "Subcategory not found" });
            return;
        }
        // Update subcategory
        const updatedSubCategory = yield SubCategory_1.default.findByIdAndUpdate(subCategoryId, updatedData, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: "SubCategory updated successfully",
            data: updatedSubCategory,
        });
    }
    catch (error) {
        console.error("Error in updateSubCategory:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const deleteSubCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subCategoryId = req.params.id;
        // Validate subcategory ID
        if (!mongoose_1.default.Types.ObjectId.isValid(subCategoryId)) {
            res.status(400).json({ success: false, error: "Invalid subcategory ID" });
            return;
        }
        // Check if subcategory exists
        const subCategory = yield SubCategory_1.default.findById(subCategoryId);
        if (!subCategory) {
            res.status(404).json({ success: false, error: "Subcategory not found" });
            return;
        }
        // Delete subcategory
        yield SubCategory_1.default.findByIdAndDelete(subCategoryId);
        res.status(200).json({
            success: true,
            message: "SubCategory deleted successfully",
            data: { id: subCategoryId },
        });
    }
    catch (error) {
        console.error("Error in deleteSubCategory:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getSubCategories,
    getSubCategoriesByCategoryId,
    getSubCategoryById,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
};
