import express, { Router, RequestHandler } from 'express';
const router: Router = express.Router();
import userController from '../controllers/userController';

// User routes
router.get('/', userController.getUsers as RequestHandler);
router.get('/:id', userController.getUserById as RequestHandler);
router.post('/', userController.createUser as RequestHandler);
router.put('/:id', userController.updateUser as RequestHandler);
router.delete('/:id', userController.deleteUser as RequestHandler);

// Seller-specific routes
router.put('/:id/seller', userController.updateSellerInfo as RequestHandler);

export default router;