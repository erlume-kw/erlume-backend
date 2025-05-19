import express from 'express';
const router = express.Router();
import outfitItemController from '../controllers/outfitItemController';

// Define routes and map to controller methods
router.get('/', outfitItemController.getOutfitItems);
router.get('/outfit/:outfitId', outfitItemController.getOutfitItemsByOutfitId);
router.get('/:id', outfitItemController.getOutfitItemById);
router.post('/', outfitItemController.createOutfitItem);
router.put('/:id', outfitItemController.updateOutfitItem);
router.delete('/:id', outfitItemController.deleteOutfitItem);
router.patch('/:id/featured', outfitItemController.toggleFeaturedItem);

export default router; 