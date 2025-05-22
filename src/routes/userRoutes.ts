import express from 'express';
const router = express.Router();
import userController from '../controllers/userController';

// Define routes and map to controller methods
router.get('/', userController.getUsers);            
router.get('/:id', userController.getUserById);     
router.post('/', userController.createUser);        

export default router;