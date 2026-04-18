// src/routes/wishlistRoutes.ts

import express from "express";
import wishlistController from "../controllers/wishlistController";

const router = express.Router();

// GET  /api/wishlist/:userId         — fetch full wishlist (items populated)
router.get("/:userId", wishlistController.getWishlist);

// POST /api/wishlist/:userId/items   — add an item  { item_id }
router.post("/:userId/items", wishlistController.addToWishlist);

// DELETE /api/wishlist/:userId/items/:itemId  — remove one item
router.delete("/:userId/items/:itemId", wishlistController.removeFromWishlist);

// DELETE /api/wishlist/:userId       — clear the whole wishlist
router.delete("/:userId", wishlistController.clearWishlist);

export default router;
