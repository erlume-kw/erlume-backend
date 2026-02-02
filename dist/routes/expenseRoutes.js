"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const expenseController_1 = __importDefault(require("../controllers/expenseController"));
// Define routes and map to controller methods
router.get("/", expenseController_1.default.getExpenses);
router.get("/:id", expenseController_1.default.getExpenseById);
router.post("/", expenseController_1.default.createExpense);
router.put("/:id", expenseController_1.default.updateExpense);
router.delete("/:id", expenseController_1.default.deleteExpense);
exports.default = router;
