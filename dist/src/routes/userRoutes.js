"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const userController_1 = __importDefault(require("../controllers/userController"));
// User routes
router.get('/', userController_1.default.getUsers);
router.get('/:id', userController_1.default.getUserById);
router.post('/', userController_1.default.createUser);
router.put('/:id', userController_1.default.updateUser);
router.delete('/:id', userController_1.default.deleteUser);
// Seller-specific routes
router.put('/:id/seller', userController_1.default.updateSellerInfo);
exports.default = router;
