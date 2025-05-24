"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const subCategoryController_1 = __importDefault(require("../controllers/subCategoryController"));
// Define routes and map to controller methods
router.get('/', subCategoryController_1.default.getSubCategories);
router.get('/category/:categoryId', subCategoryController_1.default.getSubCategoriesByCategoryId);
router.get('/:id', subCategoryController_1.default.getSubCategoryById);
router.post('/', subCategoryController_1.default.createSubCategory);
router.put('/:id', subCategoryController_1.default.updateSubCategory);
router.delete('/:id', subCategoryController_1.default.deleteSubCategory);
exports.default = router;
