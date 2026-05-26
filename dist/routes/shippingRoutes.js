"use strict";
// src/routes/shippingRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shippingController_1 = __importDefault(require("../controllers/shippingController"));
const auth_1 = require("../middleware/auth");
const userEnums_1 = require("../enums/userEnums");
const router = express_1.default.Router();
const adminOnly = [auth_1.authenticate, (0, auth_1.requireRole)(userEnums_1.UserRole.ADMIN)];
// ── Public ────────────────────────────────────────────────────────────────────
router.get("/", shippingController_1.default.getShippingMethods);
router.get("/zone/:governorate", shippingController_1.default.getShippingByZone);
router.get("/:id", shippingController_1.default.getShippingMethodById);
// ── Admin ─────────────────────────────────────────────────────────────────────
router.post("/", ...adminOnly, shippingController_1.default.createShippingMethod);
router.put("/:id", ...adminOnly, shippingController_1.default.updateShippingMethod);
router.delete("/:id", ...adminOnly, shippingController_1.default.deleteShippingMethod);
exports.default = router;
