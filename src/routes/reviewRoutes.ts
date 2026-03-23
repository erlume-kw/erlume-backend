import express from "express";
import { z } from "zod";
const router = express.Router();
import reviewController from "../controllers/reviewController";
import { validate, validateParams } from "../middleware/validation";
import {
	createReviewSchema,
	updateReviewSchema,
	idParamSchema,
	sellerIdParamSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", reviewController.getReviews);
router.get("/product/:productId", validateParams(z.object({ productId: z.string() })), reviewController.getReviewsByProductId);
router.get("/seller/:sellerId", validateParams(sellerIdParamSchema), reviewController.getReviewsBySellerId);
router.get("/:id", validateParams(idParamSchema), reviewController.getReviewById);
router.post("/", validate(createReviewSchema), reviewController.createReview);
router.put("/:id", validateParams(idParamSchema), validate(updateReviewSchema), reviewController.updateReview);
router.delete("/:id", validateParams(idParamSchema), reviewController.deleteReview);

export default router; 