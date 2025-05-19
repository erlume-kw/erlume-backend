import express from 'express';
const router = express.Router();
import imageController from '../controllers/imageController';

// Define routes and map to controller methods
router.get('/', imageController.getImages);
router.get('/item/:itemId', imageController.getImagesByItemId);
router.get('/:id', imageController.getImageById);
router.post('/', imageController.uploadImage);
router.put('/:id', imageController.updateImage);
router.delete('/:id', imageController.deleteImage);
router.patch('/:id/default', imageController.setDefaultImage);

export default router; 