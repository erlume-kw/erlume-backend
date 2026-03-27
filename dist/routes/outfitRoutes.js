"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const outfitController_1 = __importDefault(require("../controllers/outfitController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", outfitController_1.default.getOutfits);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), outfitController_1.default.getOutfitById);
router.post("/", (0, validation_1.validate)(schemas_1.createOutfitSchema), outfitController_1.default.createOutfit);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateOutfitSchema), outfitController_1.default.updateOutfit);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), outfitController_1.default.deleteOutfit);
exports.default = router;
