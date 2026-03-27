import express from "express";
const router = express.Router();
import expenseController from "../controllers/expenseController";
import { validate, validateParams, validateQuery } from "../middleware/validation";
import {
	createExpenseSchema,
	updateExpenseSchema,
	idParamSchema,
	dateFilterQuerySchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", validateQuery(dateFilterQuerySchema), expenseController.getExpenses);
router.get("/:id", validateParams(idParamSchema), expenseController.getExpenseById);
router.post("/", validate(createExpenseSchema), expenseController.createExpense);
router.put("/:id", validateParams(idParamSchema), validate(updateExpenseSchema), expenseController.updateExpense);
router.delete("/:id", validateParams(idParamSchema), expenseController.deleteExpense);

export default router;
