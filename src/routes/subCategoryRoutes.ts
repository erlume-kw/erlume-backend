import express from 'express';
const router = express.Router();
import subCategoryController from '../controllers/subCategoryController';

// Define routes and map to controller methods
router.get('/', subCategoryController.getSubCategories);
router.get('/category/:categoryId', subCategoryController.getSubCategoriesByCategoryId);
router.get('/:id', subCategoryController.getSubCategoryById);
router.post('/', subCategoryController.createSubCategory);
router.put('/:id', subCategoryController.updateSubCategory);
router.delete('/:id', subCategoryController.deleteSubCategory);

export default router; 