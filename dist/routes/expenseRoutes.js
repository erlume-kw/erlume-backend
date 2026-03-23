"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const expenseController_1 = __importDefault(require("../controllers/expenseController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", (0, validation_1.validateQuery)(schemas_1.dateFilterQuerySchema), expenseController_1.default.getExpenses);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), expenseController_1.default.getExpenseById);
router.post("/", (0, validation_1.validate)(schemas_1.createExpenseSchema), expenseController_1.default.createExpense);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateExpenseSchema), expenseController_1.default.updateExpense);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), expenseController_1.default.deleteExpense);
exports.default = router;
