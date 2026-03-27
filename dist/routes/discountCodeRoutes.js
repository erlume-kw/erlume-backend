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
// Define routes and map to controller methods
router.get("/", discountCodeController_1.default.getDiscountCodes);
router.get("/code/:code", (0, validation_1.validateParams)(schemas_1.codeParamSchema), discountCodeController_1.default.getDiscountCodeByCode);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), discountCodeController_1.default.getDiscountCodeById);
router.post("/", (0, validation_1.validate)(schemas_1.createDiscountCodeSchema), discountCodeController_1.default.createDiscountCode);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateDiscountCodeSchema), discountCodeController_1.default.updateDiscountCode);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), discountCodeController_1.default.deleteDiscountCode);
router.post("/validate", (0, validation_1.validate)(schemas_1.validateDiscountCodeSchema), discountCodeController_1.default.validateDiscountCode);
exports.default = router;
