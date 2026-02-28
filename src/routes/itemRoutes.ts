import express from 'express';
const router = express.Router();
import itemController from '../controllers/itemController';

// Define routes and map to controller methods
router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);
router.post('/', itemController.createItem);
router.put('/:id', itemController.updateItem);
router.patch('/:id', itemController.updateItem);
router.delete('/:id', itemController.deleteItem);

export default router; 