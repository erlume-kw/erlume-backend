"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const transactionController_1 = __importDefault(require("../controllers/transactionController"));
// Define routes and map to controller methods
router.get('/', transactionController_1.default.getTransactions);
router.get('/order/:orderId', transactionController_1.default.getTransactionsByOrderId);
router.get('/:id', transactionController_1.default.getTransactionById);
router.post('/', transactionController_1.default.createTransaction);
router.put('/:id', transactionController_1.default.updateTransaction);
router.patch('/:id', transactionController_1.default.updateTransaction);
router.patch('/:id/status', transactionController_1.default.updateTransactionStatus);
router.delete('/:id', transactionController_1.default.deleteTransaction);
exports.default = router;
