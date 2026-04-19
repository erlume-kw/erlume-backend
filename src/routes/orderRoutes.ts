import express, { RequestHandler } from "express";
const router = express.Router();
import orderController from "../controllers/orderController";
import { validate, validateParams, validateQuery } from "../middleware/validation";
import {
	createOrderSchema,
	updateOrderSchema,
	updateOrderStatusSchema,
	idParamSchema,
	userIdParamSchema,
	dateFilterQuerySchema,
} from "../validations/schemas";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../enums/userEnums";

const adminOnly = [authenticate, requireRole(UserRole.ADMIN)];

// Public
router.post("/validate-cart", orderController.validateCart as RequestHandler);
router.post("/", validate(createOrderSchema), orderController.createOrder as RequestHandler);

// Authenticated users
router.get("/user/:userId", authenticate, validateParams(userIdParamSchema), validateQuery(dateFilterQuerySchema), orderController.getOrdersByUserId as RequestHandler);
router.get("/:id", authenticate, validateParams(idParamSchema), orderController.getOrderById as RequestHandler);

// Admin only
router.get("/", ...adminOnly, validateQuery(dateFilterQuerySchema), orderController.getOrders as RequestHandler);
router.patch("/:id/status", ...adminOnly, validateParams(idParamSchema), validate(updateOrderStatusSchema), orderController.updateOrderStatus as RequestHandler);
router.patch("/:id", ...adminOnly, validateParams(idParamSchema), validate(updateOrderSchema), orderController.updateOrder as RequestHandler);
router.delete("/:id", ...adminOnly, validateParams(idParamSchema), orderController.deleteOrder as RequestHandler);

export default router;
