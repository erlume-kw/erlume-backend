import express from "express";
const router = express.Router();
import expenseController from "../controllers/expenseController";

// Define routes and map to controller methods
router.get("/", expenseController.getExpenses);
router.get("/:id", expenseController.getExpenseById);
router.post("/", expenseController.createExpense);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

export default router;
