"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const creditCardController_1 = __importDefault(require("../controllers/creditCardController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
const auth_1 = require("../middleware/auth");
const userEnums_1 = require("../enums/userEnums");
const adminOnly = [auth_1.authenticate, (0, auth_1.requireRole)(userEnums_1.UserRole.ADMIN)];
// Authenticated users (own cards)
router.get("/user/:userId", auth_1.authenticate, (0, validation_1.validateParams)(schemas_1.userIdParamSchema), creditCardController_1.default.getCreditCardsByUserId);
router.get("/:id", auth_1.authenticate, (0, validation_1.validateParams)(schemas_1.idParamSchema), creditCardController_1.default.getCreditCardById);
router.post("/", auth_1.authenticate, (0, validation_1.validate)(schemas_1.createCreditCardSchema), creditCardController_1.default.createCreditCard);
router.put("/:id", auth_1.authenticate, (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateCreditCardSchema), creditCardController_1.default.updateCreditCard);
router.delete("/:id", auth_1.authenticate, (0, validation_1.validateParams)(schemas_1.idParamSchema), creditCardController_1.default.deleteCreditCard);
// Admin only
router.get("/", ...adminOnly, creditCardController_1.default.getCreditCards);
exports.default = router;
