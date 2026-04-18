// src/routes/newsletterRoutes.ts

import express from "express";
import newsletterController from "../controllers/newsletterController";

const router = express.Router();

// POST /api/newsletter              → subscribe { email }  (public)
router.post("/", newsletterController.subscribe);

// DELETE /api/newsletter/:email     → unsubscribe by email (public)
router.delete("/:email", newsletterController.unsubscribe);

// GET /api/newsletter               → list subscribers    (admin only — auth added later)
router.get("/", newsletterController.getSubscribers);

export default router;
