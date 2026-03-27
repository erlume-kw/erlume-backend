import express from "express";
const router = express.Router();
import creditCardController from "../controllers/creditCardController";
import { validate, validateParams } from "../middleware/validation";
import {
	createCreditCardSchema,
	updateCreditCardSchema,
	idParamSchema,
	userIdParamSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
// More specific routes must come before generic ones
router.get("/user/:userId", validateParams(userIdParamSchema), creditCardController.getCreditCardsByUserId);
router.get("/", creditCardController.getCreditCards);
router.get("/:id", validateParams(idParamSchema), creditCardController.getCreditCardById);
router.post("/", validate(createCreditCardSchema), creditCardController.createCreditCard);
router.put("/:id", validateParams(idParamSchema), validate(updateCreditCardSchema), creditCardController.updateCreditCard);
router.delete("/:id", validateParams(idParamSchema), creditCardController.deleteCreditCard);

export default router; 