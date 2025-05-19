import express from 'express';
const router = express.Router();
import userController from '../controllers/userController';

// Define routes and map to controller methods
router.get('/users', userController.getUsers);            
router.get('/users/:id', userController.getUserById);     
router.post('/users', userController.createUser);        

export default router;