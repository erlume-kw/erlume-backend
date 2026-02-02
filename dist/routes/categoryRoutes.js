"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const categoryController_1 = __importDefault(require("../controllers/categoryController"));
// Define routes and map to controller methods
router.get('/', categoryController_1.default.getCategories);
router.get('/:id', categoryController_1.default.getCategoryById);
router.post('/', categoryController_1.default.createCategory);
router.put('/:id', categoryController_1.default.updateCategory);
router.delete('/:id', categoryController_1.default.deleteCategory);
exports.default = router;
