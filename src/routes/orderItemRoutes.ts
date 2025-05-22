import express from 'express';
const router = express.Router();
import orderItemController from '../controllers/orderItemController';

// Define routes and map to controller methods
router.get('/', orderItemController.getOrderItems);
router.get('/order/:orderId', orderItemController.getOrderItemsByOrderId);
router.get('/:id', orderItemController.getOrderItemById);
router.post('/', orderItemController.createOrderItem);
router.put('/:id', orderItemController.updateOrderItem);
router.delete('/:id', orderItemController.deleteOrderItem);
router.patch('/:id/return', orderItemController.markOrderItemReturned);

export default router; 