"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const orderController_1 = __importDefault(require("../controllers/orderController"));
// Define routes and map to controller methods
router.get('/', orderController_1.default.getOrders);
router.get('/user/:userId', orderController_1.default.getOrdersByUserId);
router.get('/:id', orderController_1.default.getOrderById);
router.post('/', orderController_1.default.createOrder);
router.patch('/:id/status', orderController_1.default.updateOrderStatus);
router.delete('/:id', orderController_1.default.deleteOrder);
exports.default = router;
