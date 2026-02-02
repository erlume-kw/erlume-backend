"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const reviewController_1 = __importDefault(require("../controllers/reviewController"));
// Define routes and map to controller methods
router.get('/', reviewController_1.default.getReviews);
router.get('/product/:productId', reviewController_1.default.getReviewsByProductId);
router.get('/seller/:sellerId', reviewController_1.default.getReviewsBySellerId);
router.get('/:id', reviewController_1.default.getReviewById);
router.post('/', reviewController_1.default.createReview);
router.put('/:id', reviewController_1.default.updateReview);
router.delete('/:id', reviewController_1.default.deleteReview);
exports.default = router;
