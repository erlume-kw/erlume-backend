"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enumController_1 = require("../controllers/enumController");
const router = (0, express_1.Router)();
/**
 * GET /api/enums
 * Returns all enums used in the system
 * Useful for frontend/Retool to dynamically populate dropdowns
 */
router.get("/", enumController_1.getEnums);
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
router.get("/:category", enumController_1.getEnumCategory);
exports.default = router;
