"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const orderItemController_1 = __importDefault(require("../controllers/orderItemController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", orderItemController_1.default.getOrderItems);
router.get("/order/:orderId", (0, validation_1.validateParams)(schemas_1.orderIdParamSchema), orderItemController_1.default.getOrderItemsByOrderId);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), orderItemController_1.default.getOrderItemById);
router.post("/", (0, validation_1.validate)(schemas_1.createOrderItemSchema), orderItemController_1.default.createOrderItem);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateOrderItemSchema), orderItemController_1.default.updateOrderItem);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), orderItemController_1.default.deleteOrderItem);
router.patch("/:id/return", (0, validation_1.validateParams)(schemas_1.idParamSchema), orderItemController_1.default.markOrderItemReturned);
exports.default = router;
