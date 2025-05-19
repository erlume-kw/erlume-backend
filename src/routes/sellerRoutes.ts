import express from 'express';
const router = express.Router();
import sellerController from '../controllers/sellerController';

// Define routes and map to controller methods
router.get('/', sellerController.getSellers);
router.get('/:id', sellerController.getSellerById);
router.post('/', sellerController.createSeller);
router.put('/:id', sellerController.updateSeller);
router.delete('/:id', sellerController.deleteSeller);

export default router; 