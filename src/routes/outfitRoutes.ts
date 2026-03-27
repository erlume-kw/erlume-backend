import express from "express";
const router = express.Router();
import outfitController from "../controllers/outfitController";
import { validate, validateParams } from "../middleware/validation";
import {
	createOutfitSchema,
	updateOutfitSchema,
	idParamSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", outfitController.getOutfits);
router.get("/:id", validateParams(idParamSchema), outfitController.getOutfitById);
router.post("/", validate(createOutfitSchema), outfitController.createOutfit);
router.put("/:id", validateParams(idParamSchema), validate(updateOutfitSchema), outfitController.updateOutfit);
router.delete("/:id", validateParams(idParamSchema), outfitController.deleteOutfit);

export default router; 