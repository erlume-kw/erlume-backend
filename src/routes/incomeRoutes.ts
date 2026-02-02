import express from "express";
const router = express.Router();
import incomeController from "../controllers/incomeController";

router.get("/", incomeController.getIncomes);
router.get("/:id", incomeController.getIncomeById);
router.post("/", incomeController.createIncome);
router.put("/:id", incomeController.updateIncome);
router.patch("/:id", incomeController.updateIncome);
router.delete("/:id", incomeController.deleteIncome);

export default router;
