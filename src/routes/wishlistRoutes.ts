// src/routes/wishlistRoutes.ts
import express, { RequestHandler } from "express";
import wishlistController from "../controllers/wishlistController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// All wishlist routes require a logged-in user
router.get("/:userId", authenticate, wishlistController.getWishlist as RequestHandler);
router.post("/:userId/items", authenticate, wishlistController.addToWishlist as RequestHandler);
router.delete("/:userId/items/:itemId", authenticate, wishlistController.removeFromWishlist as RequestHandler);
router.delete("/:userId", authenticate, wishlistController.clearWishlist as RequestHandler);

export default router;
