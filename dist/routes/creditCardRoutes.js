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
// Define routes and map to controller methods
// More specific routes must come before generic ones
router.get("/user/:userId", (0, validation_1.validateParams)(schemas_1.userIdParamSchema), creditCardController_1.default.getCreditCardsByUserId);
router.get("/", creditCardController_1.default.getCreditCards);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), creditCardController_1.default.getCreditCardById);
router.post("/", (0, validation_1.validate)(schemas_1.createCreditCardSchema), creditCardController_1.default.createCreditCard);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateCreditCardSchema), creditCardController_1.default.updateCreditCard);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), creditCardController_1.default.deleteCreditCard);
exports.default = router;
