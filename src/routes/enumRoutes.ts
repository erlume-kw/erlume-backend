import { Router } from "express";
import { getEnums, getEnumCategory } from "../controllers/enumController";
import { validateParams } from "../middleware/validation";
import { categoryParamSchema } from "../validations/schemas";

const router = Router();

/**
 * GET /api/enums
 * Returns all enums used in the system
 * Useful for frontend/Retool to dynamically populate dropdowns
 */
router.get("/", getEnums);

/**
 * GET /api/enums/:category
 * Returns a specific enum category
 * Available categories:
 * - orderStatus
 * - itemStatus
 * - userRole
 * - dropStatus
 * - itemCondition
 * - reviewStars
 * - kuwaitGovernorate
 * - kuwaitCity
 * - kuwaitGovernorateCities
 */
router.get("/:category", validateParams(categoryParamSchema), getEnumCategory);

export default router;
