import express from "express";
const router = express.Router();
import itemController from "../controllers/itemController";
import { validate, validateParams, validateQuery } from "../middleware/validation";
import {
	createItemSchema,
	updateItemSchema,
	idParamSchema,
	itemFilterQuerySchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", validateQuery(itemFilterQuerySchema), itemController.getItems);
router.get("/:id", validateParams(idParamSchema), itemController.getItemById);
router.post("/", validate(createItemSchema), itemController.createItem);
router.put("/:id", validateParams(idParamSchema), validate(updateItemSchema), itemController.updateItem);
router.patch("/:id", validateParams(idParamSchema), validate(updateItemSchema), itemController.updateItem);
router.delete("/:id", validateParams(idParamSchema), itemController.deleteItem);

export default router; 