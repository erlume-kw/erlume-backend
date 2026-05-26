"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const discountCodeController_1 = __importDefault(require("../controllers/discountCodeController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
const auth_1 = require("../middleware/auth");
const userEnums_1 = require("../enums/userEnums");
const adminOnly = [auth_1.authenticate, (0, auth_1.requireRole)(userEnums_1.UserRole.ADMIN)];
// Public — validate a code at checkout
router.post("/validate", (0, validation_1.validate)(schemas_1.validateDiscountCodeSchema), discountCodeController_1.default.validateDiscountCode);
// Admin only
router.get("/", ...adminOnly, discountCodeController_1.default.getDiscountCodes);
router.get("/code/:code", ...adminOnly, (0, validation_1.validateParams)(schemas_1.codeParamSchema), discountCodeController_1.default.getDiscountCodeByCode);
router.get("/:id", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), discountCodeController_1.default.getDiscountCodeById);
router.post("/", ...adminOnly, (0, validation_1.validate)(schemas_1.createDiscountCodeSchema), discountCodeController_1.default.createDiscountCode);
router.put("/:id", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateDiscountCodeSchema), discountCodeController_1.default.updateDiscountCode);
router.delete("/:id", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), discountCodeController_1.default.deleteDiscountCode);
exports.default = router;
