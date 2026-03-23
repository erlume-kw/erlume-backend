import express from "express";
import { z } from "zod";
const router = express.Router();
import outfitItemController from "../controllers/outfitItemController";
import { validate, validateParams } from "../middleware/validation";
import {
	createOutfitItemSchema,
	updateOutfitItemSchema,
	toggleOutfitItemFeaturedBodySchema,
	idParamSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", outfitItemController.getOutfitItems);
router.get("/outfit/:outfitId", validateParams(z.object({ outfitId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), outfitItemController.getOutfitItemsByOutfitId);
router.get("/:id", validateParams(idParamSchema), outfitItemController.getOutfitItemById);
router.post("/", validate(createOutfitItemSchema), outfitItemController.createOutfitItem);
router.put("/:id", validateParams(idParamSchema), validate(updateOutfitItemSchema), outfitItemController.updateOutfitItem);
router.delete("/:id", validateParams(idParamSchema), outfitItemController.deleteOutfitItem);
router.patch(
	"/:id/featured",
	validateParams(idParamSchema),
	validate(toggleOutfitItemFeaturedBodySchema),
	outfitItemController.toggleFeaturedItem,
);

export default router; 