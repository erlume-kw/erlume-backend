"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const orderController_1 = __importDefault(require("../controllers/orderController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", (0, validation_1.validateQuery)(schemas_1.dateFilterQuerySchema), orderController_1.default.getOrders);
router.get("/user/:userId", (0, validation_1.validateParams)(schemas_1.userIdParamSchema), (0, validation_1.validateQuery)(schemas_1.dateFilterQuerySchema), orderController_1.default.getOrdersByUserId);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), orderController_1.default.getOrderById);
router.post("/", (0, validation_1.validate)(schemas_1.createOrderSchema), orderController_1.default.createOrder);
router.patch("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateOrderSchema), orderController_1.default.updateOrder);
router.patch("/:id/status", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateOrderStatusSchema), orderController_1.default.updateOrderStatus);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), orderController_1.default.deleteOrder);
exports.default = router;
