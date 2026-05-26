"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const itemController_1 = __importDefault(require("../controllers/itemController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
const auth_1 = require("../middleware/auth");
const userEnums_1 = require("../enums/userEnums");
const adminOnly = [auth_1.authenticate, (0, auth_1.requireRole)(userEnums_1.UserRole.ADMIN)];
// Public
router.get("/", (0, validation_1.validateQuery)(schemas_1.itemFilterQuerySchema), itemController_1.default.getItems);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), itemController_1.default.getItemById);
// Admin only
router.post("/", ...adminOnly, (0, validation_1.validate)(schemas_1.createItemSchema), itemController_1.default.createItem);
router.put("/:id", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateItemSchema), itemController_1.default.updateItem);
router.patch("/:id", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateItemSchema), itemController_1.default.updateItem);
router.delete("/:id", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), itemController_1.default.deleteItem);
exports.default = router;
