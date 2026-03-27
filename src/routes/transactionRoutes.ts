import express from "express";
import { z } from "zod";
const router = express.Router();
import transactionController from "../controllers/transactionController";
import { validate, validateParams, validateQuery } from "../middleware/validation";
import {
	createTransactionSchema,
	updateTransactionSchema,
	idParamSchema,
	orderIdParamSchema,
	dateFilterQuerySchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", validateQuery(dateFilterQuerySchema), transactionController.getTransactions);
router.get("/order/:orderId", validateParams(orderIdParamSchema), transactionController.getTransactionsByOrderId);
router.get("/:id", validateParams(idParamSchema), transactionController.getTransactionById);
router.post("/", validate(createTransactionSchema), transactionController.createTransaction);
router.put("/:id", validateParams(idParamSchema), validate(updateTransactionSchema), transactionController.updateTransaction);
router.patch("/:id", validateParams(idParamSchema), validate(updateTransactionSchema), transactionController.updateTransaction);
router.patch("/:id/status", validateParams(idParamSchema), validate(z.object({ status: z.string() })), transactionController.updateTransactionStatus);
router.delete("/:id", validateParams(idParamSchema), transactionController.deleteTransaction);

export default router; 