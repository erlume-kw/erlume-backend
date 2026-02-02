"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const incomeController_1 = __importDefault(require("../controllers/incomeController"));
router.get("/", incomeController_1.default.getIncomes);
router.get("/:id", incomeController_1.default.getIncomeById);
router.post("/", incomeController_1.default.createIncome);
router.put("/:id", incomeController_1.default.updateIncome);
router.patch("/:id", incomeController_1.default.updateIncome);
router.delete("/:id", incomeController_1.default.deleteIncome);
exports.default = router;
