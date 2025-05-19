import express from 'express';
const router = express.Router();
import transactionController from '../controllers/transactionController';

// Define routes and map to controller methods
router.get('/', transactionController.getTransactions);
router.get('/order/:orderId', transactionController.getTransactionsByOrderId);
router.get('/:id', transactionController.getTransactionById);
router.post('/', transactionController.createTransaction);

export default router; 