import express from 'express';
const router = express.Router();
import orderController from '../controllers/orderController';

// Define routes and map to controller methods
router.get('/', orderController.getOrders);
router.get('/user/:userId', orderController.getOrdersByUserId);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);

export default router; 