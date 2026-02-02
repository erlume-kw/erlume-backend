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
const Category_1 = __importDefault(require("../models/Category"));
const SubCategory_1 = __importDefault(require("../models/SubCategory"));
const mongoose_1 = __importDefault(require("mongoose"));
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield Category_1.default.find({});
        res
            .status(200)
            .json({ success: true, data: categories, count: categories.length });
    }
    catch (error) {
        console.error("Error in getCategories:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.id;
        // Validate category ID
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            res.status(400).json({ success: false, error: "Invalid category ID" });
            return;
        }
        // Find category by ID
        const category = yield Category_1.default.findById(categoryId);
        if (!category) {
            res.status(404).json({ success: false, error: "Category not found" });
            return;
        }
        res.status(200).json({ success: true, data: category });
    }
    catch (error) {
        console.error("Error in getCategoryById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            if (!mongoose_1.default.Types.ObjectId.isValid(sub_category_id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid sub_category_id",
                });
                return;
            }
            const subCategory = yield SubCategory_1.default.findById(sub_category_id);
            if (!subCategory) {
                res.status(404).json({
                    success: false,
                    error: "SubCategory not found",
                });
                return;
            }
        }
        const newCategory = new Category_1.default({
            name,
            base_rate,
            op_rate: op_rate || undefined,
            clean_rate: clean_rate || undefined,
            sub_category_id: sub_category_id || undefined,
        });
        const savedCategory = yield newCategory.save();
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: savedCategory,
        });
    }
    catch (error) {
        console.error("Error in createCategory:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.id;
        const updatedData = req.body;
        // Validate category ID
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            res.status(400).json({ success: false, error: "Invalid category ID" });
            return;
        }
        // Check if category exists
        const category = yield Category_1.default.findById(categoryId);
        if (!category) {
            res.status(404).json({ success: false, error: "Category not found" });
            return;
        }
        // Validate sub_category_id if provided
        if (updatedData.sub_category_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(updatedData.sub_category_id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid sub_category_id",
                });
                return;
            }
            const subCategory = yield SubCategory_1.default.findById(updatedData.sub_category_id);
            if (!subCategory) {
                res.status(404).json({
                    success: false,
                    error: "SubCategory not found",
                });
                return;
            }
        }
        const updatedCategory = yield Category_1.default.findByIdAndUpdate(categoryId, updatedData, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory,
        });
    }
    catch (error) {
        console.error("Error in updateCategory:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categoryId = req.params.id;
        // Validate category ID
        if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
            res.status(400).json({ success: false, error: "Invalid category ID" });
            return;
        }
        // Check if category exists
        const category = yield Category_1.default.findById(categoryId);
        if (!category) {
            res.status(404).json({ success: false, error: "Category not found" });
            return;
        }
        // Delete category (this will trigger cascade delete of SubCategories via pre-hook)
        yield Category_1.default.findByIdAndDelete(categoryId);
        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            data: { id: categoryId },
        });
    }
    catch (error) {
        console.error("Error in deleteCategory:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
