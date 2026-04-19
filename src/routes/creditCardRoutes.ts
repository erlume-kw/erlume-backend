import express, { RequestHandler } from "express";
const router = express.Router();
import creditCardController from "../controllers/creditCardController";
import { validate, validateParams } from "../middleware/validation";
import { createCreditCardSchema, updateCreditCardSchema, idParamSchema, userIdParamSchema } from "../validations/schemas";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../enums/userEnums";

const adminOnly = [authenticate, requireRole(UserRole.ADMIN)];

// Authenticated users (own cards)
router.get("/user/:userId", authenticate, validateParams(userIdParamSchema), creditCardController.getCreditCardsByUserId as RequestHandler);
router.get("/:id", authenticate, validateParams(idParamSchema), creditCardController.getCreditCardById as RequestHandler);
router.post("/", authenticate, validate(createCreditCardSchema), creditCardController.createCreditCard as RequestHandler);
router.put("/:id", authenticate, validateParams(idParamSchema), validate(updateCreditCardSchema), creditCardController.updateCreditCard as RequestHandler);
router.delete("/:id", authenticate, validateParams(idParamSchema), creditCardController.deleteCreditCard as RequestHandler);

// Admin only
router.get("/", ...adminOnly, creditCardController.getCreditCards as RequestHandler);

export default router;
