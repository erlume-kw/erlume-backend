import express, { RequestHandler } from "express";
const router = express.Router();
import itemController from "../controllers/itemController";
import { validate, validateParams, validateQuery } from "../middleware/validation";
import { createItemSchema, updateItemSchema, idParamSchema, itemFilterQuerySchema } from "../validations/schemas";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../enums/userEnums";

const adminOnly = [authenticate, requireRole(UserRole.ADMIN)];

// Public
router.get("/", validateQuery(itemFilterQuerySchema), itemController.getItems as RequestHandler);
router.get("/:id", validateParams(idParamSchema), itemController.getItemById as RequestHandler);

// Admin only
router.post("/", ...adminOnly, validate(createItemSchema), itemController.createItem as RequestHandler);
router.put("/:id", ...adminOnly, validateParams(idParamSchema), validate(updateItemSchema), itemController.updateItem as RequestHandler);
router.patch("/:id", ...adminOnly, validateParams(idParamSchema), validate(updateItemSchema), itemController.updateItem as RequestHandler);
router.delete("/:id", ...adminOnly, validateParams(idParamSchema), itemController.deleteItem as RequestHandler);

export default router;
