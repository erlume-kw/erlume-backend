"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const creditCardController_1 = __importDefault(require("../controllers/creditCardController"));
// Define routes and map to controller methods
router.get('/', creditCardController_1.default.getCreditCards);
router.get('/user/:userId', creditCardController_1.default.getCreditCardsByUserId);
router.get('/:id', creditCardController_1.default.getCreditCardById);
router.post('/', creditCardController_1.default.createCreditCard);
router.put('/:id', creditCardController_1.default.updateCreditCard);
router.delete('/:id', creditCardController_1.default.deleteCreditCard);
exports.default = router;
