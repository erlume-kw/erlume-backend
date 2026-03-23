"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const employeeController_1 = __importDefault(require("../controllers/employeeController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
router.get("/", employeeController_1.default.getEmployees);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), employeeController_1.default.getEmployeeById);
router.post("/", (0, validation_1.validate)(schemas_1.createEmployeeSchema), employeeController_1.default.createEmployee);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateEmployeeSchema), employeeController_1.default.updateEmployee);
router.patch("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateEmployeeSchema), employeeController_1.default.updateEmployee);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), employeeController_1.default.deleteEmployee);
exports.default = router;
