// src/routes/notificationRoutes.ts

import express, { RequestHandler } from "express";
import notificationController from "../controllers/notificationController";

const router = express.Router();

// POST /api/notify              → subscribe { email, itemId, itemName, brandName } (public)
router.post("/", notificationController.subscribe as RequestHandler);

// DELETE /api/notify/:email/:itemId → unsubscribe from item (public)
router.delete("/:email/:itemId", notificationController.unsubscribe as RequestHandler);

export default router;
