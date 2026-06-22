// src/controllers/notificationController.ts

import { Request, Response } from "express";
import Notification from "../models/Notification";

/* ─── POST /api/notify ────────────────────────────────────────────────────
   Public — subscribe to notifications for a sold-out item. Idempotent:
   - New email+item → creates + returns 201
   - Already subscribed → returns 200 (no error)
   - Previously unsubscribed → reactivates + returns 200
────────────────────────────────────────────────────────────────────────── */

const subscribe = async (req: Request, res: Response): Promise<void> => {
	try {
		const { email, itemId, itemName, brandName } = req.body;

		if (!email || typeof email !== "string") {
			res.status(400).json({ success: false, error: "email is required" });
			return;
		}

		if (!itemId || typeof itemId !== "string") {
			res.status(400).json({ success: false, error: "itemId is required" });
			return;
		}

		if (!itemName || typeof itemName !== "string") {
			res.status(400).json({ success: false, error: "itemName is required" });
			return;
		}

		if (!brandName || typeof brandName !== "string") {
			res.status(400).json({ success: false, error: "brandName is required" });
			return;
		}

		const normalized = email.toLowerCase().trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(normalized)) {
			res.status(400).json({ success: false, error: "Invalid email address" });
			return;
		}

		// Check if already exists
		const existing = await Notification.findOne({ email: normalized, itemId });

		if (existing) {
			if (existing.isActive) {
				// Already subscribed — silent success
				res.status(200).json({ success: true, message: "You'll be notified when this item is back!" });
				return;
			}
			// Was unsubscribed — reactivate
			existing.isActive = true;
			existing.subscribedAt = new Date();
			existing.verificationStatus = "pending";
			existing.verifiedAt = null;
			await existing.save();
			res.status(200).json({ success: true, message: "You'll be notified when this item is back!" });
			return;
		}

		await Notification.create({
			email: normalized,
			itemId,
			itemName,
			brandName,
		});
		res.status(201).json({ success: true, message: "You'll be notified when this item is back!" });
	} catch (error) {
		console.error("Error in subscribe:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── DELETE /api/notify/:email/:itemId ──────────────────────────────────
   Public — unsubscribe from a specific item notification.
────────────────────────────────────────────────────────────────────────── */

const unsubscribe = async (req: Request, res: Response): Promise<void> => {
	try {
		const email = decodeURIComponent(req.params.email).toLowerCase().trim();
		const itemId = req.params.itemId;

		const subscription = await Notification.findOne({ email, itemId });

		if (!subscription || !subscription.isActive) {
			res.status(200).json({ success: true, message: "You've been unsubscribed." });
			return;
		}

		subscription.isActive = false;
		await subscription.save();

		res.status(200).json({ success: true, message: "You've been unsubscribed." });
	} catch (error) {
		console.error("Error in unsubscribe:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default { subscribe, unsubscribe };
