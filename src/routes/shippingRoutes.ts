// src/routes/shippingRoutes.ts

import express from "express";
import shippingController from "../controllers/shippingController";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
// GET /api/shipping               → all active methods
router.get("/", shippingController.getShippingMethods);

// GET /api/shipping/zone/:governorate  → methods for a specific Kuwait governorate
// NOTE: must come before /:id to avoid "zone" being matched as an ObjectId
router.get("/zone/:governorate", shippingController.getShippingByZone);

// GET /api/shipping/:id           → single method by ID
router.get("/:id", shippingController.getShippingMethodById);

// ── Admin ─────────────────────────────────────────────────────────────────────
// POST /api/shipping              → create
router.post("/", shippingController.createShippingMethod);

// PUT /api/shipping/:id           → update
router.put("/:id", shippingController.updateShippingMethod);

// DELETE /api/shipping/:id        → delete
router.delete("/:id", shippingController.deleteShippingMethod);

export default router;
