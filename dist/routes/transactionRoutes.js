"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const router = express_1.default.Router();
const transactionController_1 = __importDefault(require("../controllers/transactionController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", (0, validation_1.validateQuery)(schemas_1.dateFilterQuerySchema), transactionController_1.default.getTransactions);
router.get("/order/:orderId", (0, validation_1.validateParams)(schemas_1.orderIdParamSchema), transactionController_1.default.getTransactionsByOrderId);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), transactionController_1.default.getTransactionById);
router.post("/", (0, validation_1.validate)(schemas_1.createTransactionSchema), transactionController_1.default.createTransaction);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateTransactionSchema), transactionController_1.default.updateTransaction);
router.patch("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateTransactionSchema), transactionController_1.default.updateTransaction);
router.patch("/:id/status", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(zod_1.z.object({ status: zod_1.z.string() })), transactionController_1.default.updateTransactionStatus);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), transactionController_1.default.deleteTransaction);
exports.default = router;
