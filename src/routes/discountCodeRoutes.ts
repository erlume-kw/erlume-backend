import express, { RequestHandler } from "express";
const router = express.Router();
import discountCodeController from "../controllers/discountCodeController";
import { validate, validateParams } from "../middleware/validation";
import { createDiscountCodeSchema, updateDiscountCodeSchema, validateDiscountCodeSchema, idParamSchema, codeParamSchema } from "../validations/schemas";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../enums/userEnums";

const adminOnly = [authenticate, requireRole(UserRole.ADMIN)];

// Public — validate a code at checkout
router.post("/validate", validate(validateDiscountCodeSchema), discountCodeController.validateDiscountCode as RequestHandler);

// Admin only
router.get("/", ...adminOnly, discountCodeController.getDiscountCodes as RequestHandler);
router.get("/code/:code", ...adminOnly, validateParams(codeParamSchema), discountCodeController.getDiscountCodeByCode as RequestHandler);
router.get("/:id", ...adminOnly, validateParams(idParamSchema), discountCodeController.getDiscountCodeById as RequestHandler);
router.post("/", ...adminOnly, validate(createDiscountCodeSchema), discountCodeController.createDiscountCode as RequestHandler);
router.put("/:id", ...adminOnly, validateParams(idParamSchema), validate(updateDiscountCodeSchema), discountCodeController.updateDiscountCode as RequestHandler);
router.delete("/:id", ...adminOnly, validateParams(idParamSchema), discountCodeController.deleteDiscountCode as RequestHandler);

export default router;
