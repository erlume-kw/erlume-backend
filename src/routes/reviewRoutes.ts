import express from 'express';
const router = express.Router();
import reviewController from '../controllers/reviewController';

// Define routes and map to controller methods
router.get('/', reviewController.getReviews);
router.get('/product/:productId', reviewController.getReviewsByProductId);
router.get('/seller/:sellerId', reviewController.getReviewsBySellerId);
router.get('/:id', reviewController.getReviewById);
router.post('/', reviewController.createReview);
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

export default router; 