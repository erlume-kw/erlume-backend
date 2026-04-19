import express, { RequestHandler } from "express";
import { z } from "zod";
const router = express.Router();
import reviewController from "../controllers/reviewController";
import { validate, validateParams } from "../middleware/validation";
import { createReviewSchema, updateReviewSchema, idParamSchema, sellerIdParamSchema } from "../validations/schemas";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../enums/userEnums";

const adminOnly = [authenticate, requireRole(UserRole.ADMIN)];

// Public
router.get("/", reviewController.getReviews as RequestHandler);
router.get("/product/:productId", validateParams(z.object({ productId: z.string() })), reviewController.getReviewsByProductId as RequestHandler);
router.get("/seller/:sellerId", validateParams(sellerIdParamSchema), reviewController.getReviewsBySellerId as RequestHandler);
router.get("/:id", validateParams(idParamSchema), reviewController.getReviewById as RequestHandler);

// Authenticated users
router.post("/", authenticate, validate(createReviewSchema), reviewController.createReview as RequestHandler);
router.put("/:id", authenticate, validateParams(idParamSchema), validate(updateReviewSchema), reviewController.updateReview as RequestHandler);

// Admin only
router.delete("/:id", ...adminOnly, validateParams(idParamSchema), reviewController.deleteReview as RequestHandler);

export default router;
