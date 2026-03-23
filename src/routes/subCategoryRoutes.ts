import express from "express";
import { z } from "zod";
const router = express.Router();
import subCategoryController from "../controllers/subCategoryController";
import { validate, validateParams } from "../middleware/validation";
import {
	createSubCategorySchema,
	updateSubCategorySchema,
	idParamSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", subCategoryController.getSubCategories);
router.get("/category/:categoryId", validateParams(z.object({ categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), subCategoryController.getSubCategoriesByCategoryId);
router.get("/:id", validateParams(idParamSchema), subCategoryController.getSubCategoryById);
router.post("/", validate(createSubCategorySchema), subCategoryController.createSubCategory);
router.put("/:id", validateParams(idParamSchema), validate(updateSubCategorySchema), subCategoryController.updateSubCategory);
router.delete("/:id", validateParams(idParamSchema), subCategoryController.deleteSubCategory);

export default router; 