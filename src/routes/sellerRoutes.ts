import express, { Router, RequestHandler } from "express";
import userController from "../controllers/userController";
import sellerController from "../controllers/sellerController";

const router: Router = express.Router();

/**
 * Seller routes - cleaner API for seller operations
 * These routes map to user controller functions but use seller ID (which is the user ID)
 */

// Get sellers
router.get("/", sellerController.getSellers as RequestHandler);
router.get("/:id", sellerController.getSellerById as RequestHandler);
router.post("/", sellerController.createSeller as RequestHandler);

// Update seller info
router.put("/:id", userController.updateSellerInfo as RequestHandler);
router.patch("/:id", userController.updateSellerInfo as RequestHandler);

// Delete seller (soft-delete user + deactivate seller)
router.delete("/:id", sellerController.deleteSeller as RequestHandler);

export default router;
