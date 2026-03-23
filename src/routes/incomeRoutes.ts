import express from "express";
const router = express.Router();
import incomeController from "../controllers/incomeController";
import { validate, validateParams, validateQuery } from "../middleware/validation";
import {
	createIncomeSchema,
	updateIncomeSchema,
	idParamSchema,
	dateFilterQuerySchema,
} from "../validations/schemas";

router.get("/", validateQuery(dateFilterQuerySchema), incomeController.getIncomes);
router.get("/:id", validateParams(idParamSchema), incomeController.getIncomeById);
router.post("/", validate(createIncomeSchema), incomeController.createIncome);
router.put("/:id", validateParams(idParamSchema), validate(updateIncomeSchema), incomeController.updateIncome);
router.patch("/:id", validateParams(idParamSchema), validate(updateIncomeSchema), incomeController.updateIncome);
router.delete("/:id", validateParams(idParamSchema), incomeController.deleteIncome);

export default router;
