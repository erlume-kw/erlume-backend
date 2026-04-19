// src/routes/newsletterRoutes.ts

import express, { RequestHandler } from "express";
import newsletterController from "../controllers/newsletterController";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../enums/userEnums";

const router = express.Router();

// POST /api/newsletter              → subscribe { email }  (public)
router.post("/", newsletterController.subscribe as RequestHandler);

// DELETE /api/newsletter/:email     → unsubscribe by email (public)
router.delete("/:email", newsletterController.unsubscribe as RequestHandler);

// GET /api/newsletter               → list subscribers    (admin only)
router.get("/", authenticate, requireRole(UserRole.ADMIN), newsletterController.getSubscribers as RequestHandler);

export default router;
