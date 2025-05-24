"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const outfitController_1 = __importDefault(require("../controllers/outfitController"));
// Define routes and map to controller methods
router.get('/', outfitController_1.default.getOutfits);
router.get('/:id', outfitController_1.default.getOutfitById);
router.post('/', outfitController_1.default.createOutfit);
router.put('/:id', outfitController_1.default.updateOutfit);
router.delete('/:id', outfitController_1.default.deleteOutfit);
exports.default = router;
