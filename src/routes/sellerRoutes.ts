import express, { Router, RequestHandler } from "express";
import userController from "../controllers/userController";
import sellerController from "../controllers/sellerController";
import { validate, validateParams } from "../middleware/validation";
import {
	createSellerSchema,
	updateSellerSchema,
	idParamSchema,
} from "../validations/schemas";

const router: Router = express.Router();

/**
 * Seller routes - cleaner API for seller operations
 * These routes map to user controller functions but use seller ID (which is the user ID)
 */

// Get sellers
router.get("/", sellerController.getSellers as RequestHandler);
router.get("/:id", validateParams(idParamSchema), sellerController.getSellerById as RequestHandler);
router.post("/", validate(createSellerSchema), sellerController.createSeller as RequestHandler);

// Update seller info
router.put(
	"/:id",
	validateParams(idParamSchema),
	validate(updateSellerSchema),
	userController.updateSellerInfo as RequestHandler,
);
router.patch(
	"/:id",
	validateParams(idParamSchema),
	validate(updateSellerSchema),
	userController.updateSellerInfo as RequestHandler,
);

// Delete seller (soft-delete user + deactivate seller)
router.delete("/:id", validateParams(idParamSchema), sellerController.deleteSeller as RequestHandler);

export default router;
