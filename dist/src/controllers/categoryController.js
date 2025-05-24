"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getCategories = (req, res) => {
    res.send('Retrieving all categories');
};
const getCategoryById = (req, res) => {
    const categoryId = req.params.id;
    res.send(`Retrieving category with ID: ${categoryId}`);
};
const createCategory = (req, res) => {
    const newCategory = req.body;
    res.send(`Category created: ${JSON.stringify(newCategory)}`);
};
const updateCategory = (req, res) => {
    const categoryId = req.params.id;
    const updatedData = req.body;
    res.send(`Category ${categoryId} updated with: ${JSON.stringify(updatedData)}`);
};
const deleteCategory = (req, res) => {
    const categoryId = req.params.id;
    res.send(`Category ${categoryId} deleted`);
};
exports.default = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
