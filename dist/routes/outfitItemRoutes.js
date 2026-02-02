"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const outfitItemController_1 = __importDefault(require("../controllers/outfitItemController"));
// Define routes and map to controller methods
router.get('/', outfitItemController_1.default.getOutfitItems);
router.get('/outfit/:outfitId', outfitItemController_1.default.getOutfitItemsByOutfitId);
router.get('/:id', outfitItemController_1.default.getOutfitItemById);
router.post('/', outfitItemController_1.default.createOutfitItem);
router.put('/:id', outfitItemController_1.default.updateOutfitItem);
router.delete('/:id', outfitItemController_1.default.deleteOutfitItem);
router.patch('/:id/featured', outfitItemController_1.default.toggleFeaturedItem);
exports.default = router;
