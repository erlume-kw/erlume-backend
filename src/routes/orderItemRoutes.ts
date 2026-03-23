import express from "express";
const router = express.Router();
import orderItemController from "../controllers/orderItemController";
import { validate, validateParams } from "../middleware/validation";
import {
	createOrderItemSchema,
	updateOrderItemSchema,
	idParamSchema,
	orderIdParamSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", orderItemController.getOrderItems);
router.get("/order/:orderId", validateParams(orderIdParamSchema), orderItemController.getOrderItemsByOrderId);
router.get("/:id", validateParams(idParamSchema), orderItemController.getOrderItemById);
router.post("/", validate(createOrderItemSchema), orderItemController.createOrderItem);
router.put("/:id", validateParams(idParamSchema), validate(updateOrderItemSchema), orderItemController.updateOrderItem);
router.delete("/:id", validateParams(idParamSchema), orderItemController.deleteOrderItem);
router.patch("/:id/return", validateParams(idParamSchema), orderItemController.markOrderItemReturned);

export default router; 