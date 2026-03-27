"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const incomeController_1 = __importDefault(require("../controllers/incomeController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
router.get("/", (0, validation_1.validateQuery)(schemas_1.dateFilterQuerySchema), incomeController_1.default.getIncomes);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), incomeController_1.default.getIncomeById);
router.post("/", (0, validation_1.validate)(schemas_1.createIncomeSchema), incomeController_1.default.createIncome);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateIncomeSchema), incomeController_1.default.updateIncome);
router.patch("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateIncomeSchema), incomeController_1.default.updateIncome);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), incomeController_1.default.deleteIncome);
exports.default = router;
