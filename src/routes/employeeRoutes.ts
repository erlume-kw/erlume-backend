import express from "express";
const router = express.Router();
import employeeController from "../controllers/employeeController";
import { validate, validateParams } from "../middleware/validation";
import {
	createEmployeeSchema,
	updateEmployeeSchema,
	idParamSchema,
} from "../validations/schemas";

router.get("/", employeeController.getEmployees);
router.get("/:id", validateParams(idParamSchema), employeeController.getEmployeeById);
router.post("/", validate(createEmployeeSchema), employeeController.createEmployee);
router.put("/:id", validateParams(idParamSchema), validate(updateEmployeeSchema), employeeController.updateEmployee);
router.patch("/:id", validateParams(idParamSchema), validate(updateEmployeeSchema), employeeController.updateEmployee);
router.delete("/:id", validateParams(idParamSchema), employeeController.deleteEmployee);

export default router;
