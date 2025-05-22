import { Request, Response } from 'express';

const getCategories = (req: Request, res: Response) => {
  res.send('Retrieving all categories');
};

const getCategoryById = (req: Request, res: Response) => {
  const categoryId = req.params.id;
  res.send(`Retrieving category with ID: ${categoryId}`);
};

const createCategory = (req: Request, res: Response) => {
  const newCategory = req.body;
  res.send(`Category created: ${JSON.stringify(newCategory)}`);
};

const updateCategory = (req: Request, res: Response) => {
  const categoryId = req.params.id;
  const updatedData = req.body;
  res.send(`Category ${categoryId} updated with: ${JSON.stringify(updatedData)}`);
};

const deleteCategory = (req: Request, res: Response) => {
  const categoryId = req.params.id;
  res.send(`Category ${categoryId} deleted`);
};

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
}; 