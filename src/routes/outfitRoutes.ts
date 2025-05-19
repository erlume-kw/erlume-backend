import express from 'express';
const router = express.Router();
import outfitController from '../controllers/outfitController';

// Define routes and map to controller methods
router.get('/', outfitController.getOutfits);
router.get('/:id', outfitController.getOutfitById);
router.post('/', outfitController.createOutfit);
router.put('/:id', outfitController.updateOutfit);
router.delete('/:id', outfitController.deleteOutfit);

export default router; 