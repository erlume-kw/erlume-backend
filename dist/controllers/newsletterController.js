"use strict";
// src/controllers/newsletterController.ts
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
const Newsletter_1 = __importDefault(require("../models/Newsletter"));
/* ─── POST /api/newsletter ────────────────────────────────────────────────────
   Public — subscribe an email. Idempotent:
   - New email → creates + returns 201
   - Already subscribed → returns 200 (no error, no duplicate)
   - Previously unsubscribed → reactivates + returns 200
────────────────────────────────────────────────────────────────────────────── */
const subscribe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existing = yield Newsletter_1.default.findOne({ email: normalized });
        if (existing) {
            if (existing.isActive) {
                // Already subscribed — silent success (don't reveal it's a duplicate)
                res.status(200).json({ success: true, message: "You're subscribed!" });
                return;
            }
            // Was unsubscribed — reactivate
            existing.isActive = true;
            existing.subscribedAt = new Date();
            yield existing.save();
            res.status(200).json({ success: true, message: "You're subscribed!" });
            return;
        }
        yield Newsletter_1.default.create({ email: normalized });
        res.status(201).json({ success: true, message: "You're subscribed!" });
    }
    catch (error) {
        console.error("Error in subscribe:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── DELETE /api/newsletter/:email ──────────────────────────────────────────
   Public — unsubscribe. Soft-delete (keeps record, sets isActive: false).
────────────────────────────────────────────────────────────────────────────── */
const unsubscribe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = decodeURIComponent(req.params.email).toLowerCase().trim();
        const subscriber = yield Newsletter_1.default.findOne({ email });
        // Always return success — don't reveal whether email was in the list
        if (!subscriber || !subscriber.isActive) {
            res.status(200).json({ success: true, message: "You've been unsubscribed." });
            return;
        }
        subscriber.isActive = false;
        yield subscriber.save();
        res.status(200).json({ success: true, message: "You've been unsubscribed." });
    }
    catch (error) {
        console.error("Error in unsubscribe:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── GET /api/newsletter ─────────────────────────────────────────────────────
   Admin — list all subscribers (active only by default).
────────────────────────────────────────────────────────────────────────────── */
const getSubscribers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { includeInactive } = req.query;
        const filter = includeInactive === "true" ? {} : { isActive: true };
        const subscribers = yield Newsletter_1.default.find(filter)
            .select("email subscribedAt isActive createdAt")
            .sort({ subscribedAt: -1 })
            .lean();
        res.status(200).json({
            success: true,
            data: subscribers,
            count: subscribers.length,
        });
    }
    catch (error) {
        console.error("Error in getSubscribers:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = { subscribe, unsubscribe, getSubscribers };
