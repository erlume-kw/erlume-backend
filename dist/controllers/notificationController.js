"use strict";
// src/controllers/notificationController.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Notification_1 = __importDefault(require("../models/Notification"));
/* ─── POST /api/notify ────────────────────────────────────────────────────
   Public — subscribe to notifications for a sold-out item. Idempotent:
   - New email+item → creates + returns 201
   - Already subscribed → returns 200 (no error)
   - Previously unsubscribed → reactivates + returns 200
────────────────────────────────────────────────────────────────────────── */
const subscribe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existing = yield Notification_1.default.findOne({ email: normalized, itemId });
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
            yield existing.save();
            res.status(200).json({ success: true, message: "You'll be notified when this item is back!" });
            return;
        }
        yield Notification_1.default.create({
            email: normalized,
            itemId,
            itemName,
            brandName,
        });
        res.status(201).json({ success: true, message: "You'll be notified when this item is back!" });
    }
    catch (error) {
        console.error("Error in subscribe:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── DELETE /api/notify/:email/:itemId ──────────────────────────────────
   Public — unsubscribe from a specific item notification.
────────────────────────────────────────────────────────────────────────── */
const unsubscribe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = decodeURIComponent(req.params.email).toLowerCase().trim();
        const itemId = req.params.itemId;
        const subscription = yield Notification_1.default.findOne({ email, itemId });
        if (!subscription || !subscription.isActive) {
            res.status(200).json({ success: true, message: "You've been unsubscribed." });
            return;
        }
        subscription.isActive = false;
        yield subscription.save();
        res.status(200).json({ success: true, message: "You've been unsubscribed." });
    }
    catch (error) {
        console.error("Error in unsubscribe:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = { subscribe, unsubscribe };
