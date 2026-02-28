import express from "express";
const router = express.Router();
import employeeController from "../controllers/employeeController";

router.get("/", employeeController.getEmployees);
router.get("/:id", employeeController.getEmployeeById);
router.post("/", employeeController.createEmployee);
router.put("/:id", employeeController.updateEmployee);
router.patch("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);

export default router;
