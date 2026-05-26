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
const auth_1 = require("../middleware/auth");
const userEnums_1 = require("../enums/userEnums");
const adminOnly = [auth_1.authenticate, (0, auth_1.requireRole)(userEnums_1.UserRole.ADMIN)];
// Public
router.post("/validate-cart", orderController_1.default.validateCart);
router.post("/", (0, validation_1.validate)(schemas_1.createOrderSchema), orderController_1.default.createOrder);
// Authenticated users
router.get("/user/:userId", auth_1.authenticate, (0, validation_1.validateParams)(schemas_1.userIdParamSchema), (0, validation_1.validateQuery)(schemas_1.dateFilterQuerySchema), orderController_1.default.getOrdersByUserId);
router.get("/:id", auth_1.authenticate, (0, validation_1.validateParams)(schemas_1.idParamSchema), orderController_1.default.getOrderById);
// Admin only
router.get("/", ...adminOnly, (0, validation_1.validateQuery)(schemas_1.dateFilterQuerySchema), orderController_1.default.getOrders);
router.patch("/:id/status", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateOrderStatusSchema), orderController_1.default.updateOrderStatus);
router.patch("/:id", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateOrderSchema), orderController_1.default.updateOrder);
router.delete("/:id", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), orderController_1.default.deleteOrder);
exports.default = router;
