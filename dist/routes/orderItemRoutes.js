"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const orderItemController_1 = __importDefault(require("../controllers/orderItemController"));
// Define routes and map to controller methods
router.get('/', orderItemController_1.default.getOrderItems);
router.get('/order/:orderId', orderItemController_1.default.getOrderItemsByOrderId);
router.get('/:id', orderItemController_1.default.getOrderItemById);
router.post('/', orderItemController_1.default.createOrderItem);
router.put('/:id', orderItemController_1.default.updateOrderItem);
router.delete('/:id', orderItemController_1.default.deleteOrderItem);
router.patch('/:id/return', orderItemController_1.default.markOrderItemReturned);
exports.default = router;
