"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const router = express_1.default.Router();
const outfitItemController_1 = __importDefault(require("../controllers/outfitItemController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", outfitItemController_1.default.getOutfitItems);
router.get("/outfit/:outfitId", (0, validation_1.validateParams)(zod_1.z.object({ outfitId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/) })), outfitItemController_1.default.getOutfitItemsByOutfitId);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), outfitItemController_1.default.getOutfitItemById);
router.post("/", (0, validation_1.validate)(schemas_1.createOutfitItemSchema), outfitItemController_1.default.createOutfitItem);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateOutfitItemSchema), outfitItemController_1.default.updateOutfitItem);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), outfitItemController_1.default.deleteOutfitItem);
router.patch("/:id/featured", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.toggleOutfitItemFeaturedBodySchema), outfitItemController_1.default.toggleFeaturedItem);
exports.default = router;
