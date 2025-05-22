import express from 'express';
const router = express.Router();
import creditCardController from '../controllers/creditCardController';

// Define routes and map to controller methods
router.get('/', creditCardController.getCreditCards);
router.get('/user/:userId', creditCardController.getCreditCardsByUserId);
router.get('/:id', creditCardController.getCreditCardById);
router.post('/', creditCardController.createCreditCard);
router.put('/:id', creditCardController.updateCreditCard);
router.delete('/:id', creditCardController.deleteCreditCard);

export default router; 