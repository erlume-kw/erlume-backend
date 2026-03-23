"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const router = express_1.default.Router();
const subCategoryController_1 = __importDefault(require("../controllers/subCategoryController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", subCategoryController_1.default.getSubCategories);
router.get("/category/:categoryId", (0, validation_1.validateParams)(zod_1.z.object({ categoryId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/) })), subCategoryController_1.default.getSubCategoriesByCategoryId);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), subCategoryController_1.default.getSubCategoryById);
router.post("/", (0, validation_1.validate)(schemas_1.createSubCategorySchema), subCategoryController_1.default.createSubCategory);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateSubCategorySchema), subCategoryController_1.default.updateSubCategory);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), subCategoryController_1.default.deleteSubCategory);
exports.default = router;
