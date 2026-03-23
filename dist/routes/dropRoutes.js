"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const dropController_1 = __importDefault(require("../controllers/dropController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", dropController_1.default.getDrops);
router.post("/", (0, validation_1.validate)(schemas_1.createDropSchema), dropController_1.default.createDrop);
// Drop items routes (must come before /:id to avoid route conflicts)
router.get("/:id/items", (0, validation_1.validateParams)(schemas_1.idParamSchema), dropController_1.default.getDropItems);
router.post("/:id/items", (0, validation_1.validateParams)(schemas_1.idParamSchema), dropController_1.default.addItemToDrop);
router.delete("/:id/items/:itemId", (0, validation_1.validateParams)(schemas_1.dropItemParamsSchema), dropController_1.default.removeItemFromDrop);
// Drop CRUD routes
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), dropController_1.default.getDropById);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateDropSchema), dropController_1.default.updateDrop);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), dropController_1.default.deleteDrop);
exports.default = router;
