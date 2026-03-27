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
// Define routes and map to controller methods
router.get("/", (0, validation_1.validateQuery)(schemas_1.itemFilterQuerySchema), itemController_1.default.getItems);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), itemController_1.default.getItemById);
router.post("/", (0, validation_1.validate)(schemas_1.createItemSchema), itemController_1.default.createItem);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateItemSchema), itemController_1.default.updateItem);
router.patch("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateItemSchema), itemController_1.default.updateItem);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), itemController_1.default.deleteItem);
exports.default = router;
