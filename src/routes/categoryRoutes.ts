import express from 'express';
const router = express.Router();
import categoryController from '../controllers/categoryController';

// Define routes and map to controller methods
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router; 