"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const employeeController_1 = __importDefault(require("../controllers/employeeController"));
router.get("/", employeeController_1.default.getEmployees);
router.get("/:id", employeeController_1.default.getEmployeeById);
router.post("/", employeeController_1.default.createEmployee);
router.put("/:id", employeeController_1.default.updateEmployee);
router.patch("/:id", employeeController_1.default.updateEmployee);
router.delete("/:id", employeeController_1.default.deleteEmployee);
exports.default = router;
