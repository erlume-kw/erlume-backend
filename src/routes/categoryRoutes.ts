import express from "express";
const router = express.Router();
import categoryController from "../controllers/categoryController";
import { validate, validateParams } from "../middleware/validation";
import {
	createCategorySchema,
	updateCategorySchema,
	idParamSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", categoryController.getCategories);
router.get("/:id", validateParams(idParamSchema), categoryController.getCategoryById);
router.post("/", validate(createCategorySchema), categoryController.createCategory);
router.put("/:id", validateParams(idParamSchema), validate(updateCategorySchema), categoryController.updateCategory);
router.delete("/:id", validateParams(idParamSchema), categoryController.deleteCategory);

export default router; 