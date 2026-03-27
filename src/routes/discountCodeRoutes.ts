import express from "express";
const router = express.Router();
import discountCodeController from "../controllers/discountCodeController";
import { validate, validateParams } from "../middleware/validation";
import {
	createDiscountCodeSchema,
	updateDiscountCodeSchema,
	validateDiscountCodeSchema,
	idParamSchema,
	codeParamSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", discountCodeController.getDiscountCodes);
router.get("/code/:code", validateParams(codeParamSchema), discountCodeController.getDiscountCodeByCode);
router.get("/:id", validateParams(idParamSchema), discountCodeController.getDiscountCodeById);
router.post("/", validate(createDiscountCodeSchema), discountCodeController.createDiscountCode);
router.put(
	"/:id",
	validateParams(idParamSchema),
	validate(updateDiscountCodeSchema),
	discountCodeController.updateDiscountCode,
);
router.delete("/:id", validateParams(idParamSchema), discountCodeController.deleteDiscountCode);
router.post("/validate", validate(validateDiscountCodeSchema), discountCodeController.validateDiscountCode);

export default router; 