// src/routes/shippingRoutes.ts

import express, { RequestHandler } from "express";
import shippingController from "../controllers/shippingController";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../enums/userEnums";

const router = express.Router();

const adminOnly = [authenticate, requireRole(UserRole.ADMIN)];

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/", shippingController.getShippingMethods as RequestHandler);
router.get("/zone/:governorate", shippingController.getShippingByZone as RequestHandler);
router.get("/:id", shippingController.getShippingMethodById as RequestHandler);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post("/", ...adminOnly, shippingController.createShippingMethod as RequestHandler);
router.put("/:id", ...adminOnly, shippingController.updateShippingMethod as RequestHandler);
router.delete("/:id", ...adminOnly, shippingController.deleteShippingMethod as RequestHandler);

export default router;
