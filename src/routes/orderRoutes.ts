import express from "express";
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

// Define routes and map to controller methods

// POST /api/orders/validate-cart — pre-checkout availability check (must be before /:id)
router.post("/validate-cart", orderController.validateCart);

router.get("/", validateQuery(dateFilterQuerySchema), orderController.getOrders);
router.get(
	"/user/:userId",
	validateParams(userIdParamSchema),
	validateQuery(dateFilterQuerySchema),
	orderController.getOrdersByUserId,
);
router.get("/:id", validateParams(idParamSchema), orderController.getOrderById);
router.post("/", validate(createOrderSchema), orderController.createOrder);
router.patch("/:id", validateParams(idParamSchema), validate(updateOrderSchema), orderController.updateOrder);
router.patch(
	"/:id/status",
	validateParams(idParamSchema),
	validate(updateOrderStatusSchema),
	orderController.updateOrderStatus,
);
router.delete("/:id", validateParams(idParamSchema), orderController.deleteOrder);

export default router;
