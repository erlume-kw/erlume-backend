import express from 'express';
const router = express.Router();
import discountCodeController from '../controllers/discountCodeController';

// Define routes and map to controller methods
router.get('/', discountCodeController.getDiscountCodes);
router.get('/code/:code', discountCodeController.getDiscountCodeByCode);
router.get('/:id', discountCodeController.getDiscountCodeById);
router.post('/', discountCodeController.createDiscountCode);
router.put('/:id', discountCodeController.updateDiscountCode);
router.delete('/:id', discountCodeController.deleteDiscountCode);
router.post('/validate', discountCodeController.validateDiscountCode);

export default router; 