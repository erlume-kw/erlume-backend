import { Request, Response } from 'express';

const getSubCategories = (req: Request, res: Response) => {
  res.send('Retrieving all subcategories');
};

const getSubCategoriesByCategoryId = (req: Request, res: Response) => {
  const categoryId = req.params.categoryId;
  res.send(`Retrieving subcategories for category ID: ${categoryId}`);
};

const getSubCategoryById = (req: Request, res: Response) => {
  const subCategoryId = req.params.id;
  res.send(`Retrieving subcategory with ID: ${subCategoryId}`);
};

const createSubCategory = (req: Request, res: Response) => {
  const newSubCategory = req.body;
  res.send(`SubCategory created: ${JSON.stringify(newSubCategory)}`);
};

const updateSubCategory = (req: Request, res: Response) => {
  const subCategoryId = req.params.id;
  const updatedData = req.body;
  res.send(`SubCategory ${subCategoryId} updated with: ${JSON.stringify(updatedData)}`);
};

const deleteSubCategory = (req: Request, res: Response) => {
  const subCategoryId = req.params.id;
  res.send(`SubCategory ${subCategoryId} deleted`);
};

export default {
  getSubCategories,
  getSubCategoriesByCategoryId,
  getSubCategoryById,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory
}; 