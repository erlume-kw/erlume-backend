"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const demandController_1 = __importDefault(require("../controllers/demandController"));
// Define routes and map to controller methods
router.get('/', demandController_1.default.getDemands);
router.get('/subcategory/:subCategoryId', demandController_1.default.getDemandsBySubCategoryId);
router.get('/:id', demandController_1.default.getDemandById);
router.post('/', demandController_1.default.createDemand);
router.put('/:id', demandController_1.default.updateDemand);
router.delete('/:id', demandController_1.default.deleteDemand);
exports.default = router;
