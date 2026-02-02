"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const dropController_1 = __importDefault(require("../controllers/dropController"));
// Define routes and map to controller methods
router.get("/", dropController_1.default.getDrops);
router.post("/", dropController_1.default.createDrop);
// Drop items routes (must come before /:id to avoid route conflicts)
router.get("/:id/items", dropController_1.default.getDropItems);
router.post("/:id/items", dropController_1.default.addItemToDrop);
router.delete("/:id/items/:itemId", dropController_1.default.removeItemFromDrop);
// Drop CRUD routes
router.get("/:id", dropController_1.default.getDropById);
router.put("/:id", dropController_1.default.updateDrop);
router.delete("/:id", dropController_1.default.deleteDrop);
exports.default = router;
