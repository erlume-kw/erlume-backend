"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const discountCodeController_1 = __importDefault(require("../controllers/discountCodeController"));
// Define routes and map to controller methods
router.get('/', discountCodeController_1.default.getDiscountCodes);
router.get('/code/:code', discountCodeController_1.default.getDiscountCodeByCode);
router.get('/:id', discountCodeController_1.default.getDiscountCodeById);
router.post('/', discountCodeController_1.default.createDiscountCode);
router.put('/:id', discountCodeController_1.default.updateDiscountCode);
router.delete('/:id', discountCodeController_1.default.deleteDiscountCode);
router.post('/validate', discountCodeController_1.default.validateDiscountCode);
exports.default = router;
