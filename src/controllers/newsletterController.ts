// src/controllers/newsletterController.ts

import { Request, Response } from "express";
import Newsletter from "../models/Newsletter";

/* ─── POST /api/newsletter ────────────────────────────────────────────────────
   Public — subscribe an email. Idempotent:
   - New email → creates + returns 201
   - Already subscribed → returns 200 (no error, no duplicate)
   - Previously unsubscribed → reactivates + returns 200
────────────────────────────────────────────────────────────────────────────── */

const subscribe = async (req: Request, res: Response): Promise<void> => {
	try {
		const { email } = req.body;

		if (!email || typeof email !== "string") {
			res.status(400).json({ success: false, error: "email is required" });
			return;
		}

		const normalized = email.toLowerCase().trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(normalized)) {
			res.status(400).json({ success: false, error: "Invalid email address" });
			return;
		}

		// Check if already exists
		const existing = await Newsletter.findOne({ email: normalized });

		if (existing) {
			if (existing.isActive) {
				// Already subscribed — silent success (don't reveal it's a duplicate)
				res.status(200).json({ success: true, message: "You're subscribed!" });
				return;
			}
			// Was unsubscribed — reactivate
			existing.isActive = true;
			existing.subscribedAt = new Date();
			await existing.save();
			res.status(200).json({ success: true, message: "You're subscribed!" });
			return;
		}

		await Newsletter.create({ email: normalized });
		res.status(201).json({ success: true, message: "You're subscribed!" });
	} catch (error) {
		console.error("Error in subscribe:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── DELETE /api/newsletter/:email ──────────────────────────────────────────
   Public — unsubscribe. Soft-delete (keeps record, sets isActive: false).
────────────────────────────────────────────────────────────────────────────── */

const unsubscribe = async (req: Request, res: Response): Promise<void> => {
	try {
		const email = decodeURIComponent(req.params.email).toLowerCase().trim();

		const subscriber = await Newsletter.findOne({ email });

		// Always return success — don't reveal whether email was in the list
		if (!subscriber || !subscriber.isActive) {
			res.status(200).json({ success: true, message: "You've been unsubscribed." });
			return;
		}

		subscriber.isActive = false;
		await subscriber.save();

		res.status(200).json({ success: true, message: "You've been unsubscribed." });
	} catch (error) {
		console.error("Error in unsubscribe:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── GET /api/newsletter ─────────────────────────────────────────────────────
   Admin — list all subscribers (active only by default).
────────────────────────────────────────────────────────────────────────────── */

const getSubscribers = async (req: Request, res: Response): Promise<void> => {
	try {
		const { includeInactive } = req.query;

		const filter = includeInactive === "true" ? {} : { isActive: true };
		const subscribers = await Newsletter.find(filter)
			.select("email subscribedAt isActive createdAt")
			.sort({ subscribedAt: -1 })
			.lean();

		res.status(200).json({
			success: true,
			data: subscribers,
			count: subscribers.length,
		});
	} catch (error) {
		console.error("Error in getSubscribers:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default { subscribe, unsubscribe, getSubscribers };
