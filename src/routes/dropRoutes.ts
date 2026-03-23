import express from "express";
const router = express.Router();
import dropController from "../controllers/dropController";
import { validate, validateParams } from "../middleware/validation";
import {
	createDropSchema,
	updateDropSchema,
	idParamSchema,
	dropItemParamsSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", dropController.getDrops);
router.post("/", validate(createDropSchema), dropController.createDrop);

// Drop items routes (must come before /:id to avoid route conflicts)
router.get("/:id/items", validateParams(idParamSchema), dropController.getDropItems);
router.post("/:id/items", validateParams(idParamSchema), dropController.addItemToDrop);
router.delete("/:id/items/:itemId", validateParams(dropItemParamsSchema), dropController.removeItemFromDrop);

// Drop CRUD routes
router.get("/:id", validateParams(idParamSchema), dropController.getDropById);
router.put("/:id", validateParams(idParamSchema), validate(updateDropSchema), dropController.updateDrop);
router.delete("/:id", validateParams(idParamSchema), dropController.deleteDrop);

export default router;
