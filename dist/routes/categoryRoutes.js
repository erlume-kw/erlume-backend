"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const categoryController_1 = __importDefault(require("../controllers/categoryController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", categoryController_1.default.getCategories);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), categoryController_1.default.getCategoryById);
router.post("/", (0, validation_1.validate)(schemas_1.createCategorySchema), categoryController_1.default.createCategory);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateCategorySchema), categoryController_1.default.updateCategory);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), categoryController_1.default.deleteCategory);
exports.default = router;
