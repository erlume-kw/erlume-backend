"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getSubCategories = (req, res) => {
    res.send('Retrieving all subcategories');
};
const getSubCategoriesByCategoryId = (req, res) => {
    const categoryId = req.params.categoryId;
    res.send(`Retrieving subcategories for category ID: ${categoryId}`);
};
const getSubCategoryById = (req, res) => {
    const subCategoryId = req.params.id;
    res.send(`Retrieving subcategory with ID: ${subCategoryId}`);
};
const createSubCategory = (req, res) => {
    const newSubCategory = req.body;
    res.send(`SubCategory created: ${JSON.stringify(newSubCategory)}`);
};
const updateSubCategory = (req, res) => {
    const subCategoryId = req.params.id;
    const updatedData = req.body;
    res.send(`SubCategory ${subCategoryId} updated with: ${JSON.stringify(updatedData)}`);
};
const deleteSubCategory = (req, res) => {
    const subCategoryId = req.params.id;
    res.send(`SubCategory ${subCategoryId} deleted`);
};
exports.default = {
    getSubCategories,
    getSubCategoriesByCategoryId,
    getSubCategoryById,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory
};
