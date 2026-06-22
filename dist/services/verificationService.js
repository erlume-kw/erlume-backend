"use strict";
// src/services/verificationService.ts
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
exports.batchVerifyEmails = batchVerifyEmails;
const Newsletter_1 = __importDefault(require("../models/Newsletter"));
const Notification_1 = __importDefault(require("../models/Notification"));
/**
 * Batch verify emails from the last 24 hours (newsletter + notifications)
 * Called once daily at 5 PM GMT+3 (Asia/Kuwait timezone)
 * Verifies all emails that signed up within the 24-hour window before job execution
 * Example: Job at June 22, 5 PM → verifies emails from June 21, 5 PM to June 22, 5 PM
 */
function batchVerifyEmails() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            console.log("[Verifalia] Starting batch email verification...");
            // Calculate 24 hours ago from now
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            console.log(`[Verifalia] Verifying emails from last 24 hours (since ${oneDayAgo.toISOString()})`);
            // Collect pending emails from the last 24 hours from both collections
            const pendingNewsletters = yield Newsletter_1.default.find({
                verificationStatus: "pending",
                isActive: true,
                subscribedAt: { $gte: oneDayAgo },
            }).select("email");
            const pendingNotifications = yield Notification_1.default.find({
                verificationStatus: "pending",
                isActive: true,
                subscribedAt: { $gte: oneDayAgo },
            }).select("email");
            // Create a Set to deduplicate emails
            const emailsToVerify = new Set([
                ...pendingNewsletters.map((n) => n.email),
                ...pendingNotifications.map((n) => n.email),
            ]);
            if (emailsToVerify.size === 0) {
                console.log("[Verifalia] No pending emails from the last 24 hours to verify");
                return;
            }
            console.log(`[Verifalia] Verifying ${emailsToVerify.size} unique email(s) from last 24 hours`);
            // Send batch to Verifalia
            const emailsArray = Array.from(emailsToVerify);
            const results = yield sendBatchToVerifalia(emailsArray);
            // Update Newsletter records
            for (const newsletter of pendingNewsletters) {
                const result = results[newsletter.email];
                if (result) {
                    const isValid = ((_a = result.Summary) === null || _a === void 0 ? void 0 : _a.Deliverability) === "Deliverable";
                    newsletter.verificationStatus = isValid ? "valid" : "invalid";
                    newsletter.verifiedAt = new Date();
                    newsletter.verifialiaDiagnostics = result.Diagnosis || null;
                    yield newsletter.save();
                }
            }
            // Update Notification records
            for (const notification of pendingNotifications) {
                const result = results[notification.email];
                if (result) {
                    const isValid = ((_b = result.Summary) === null || _b === void 0 ? void 0 : _b.Deliverability) === "Deliverable";
                    notification.verificationStatus = isValid ? "valid" : "invalid";
                    notification.verifiedAt = new Date();
                    notification.verifialiaDiagnostics = result.Diagnosis || null;
                    yield notification.save();
                }
            }
            console.log("[Verifalia] Batch verification complete");
        }
        catch (error) {
            console.error("[Verifalia] Error during batch verification:", error);
            throw error;
        }
    });
}
/**
 * Send batch of emails to Verifalia for verification
 */
function sendBatchToVerifalia(emails) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const verifialiaUsername = process.env.VERIFALIA_USERNAME || "info@erlume.com.kw";
        const verifialiaPassword = process.env.VERIFALIA_PASSWORD || "Erlume965$";
        if (!verifialiaUsername || !verifialiaPassword) {
            throw new Error("Verifalia credentials not configured in environment");
        }
        // Create Basic Auth header
        const auth = Buffer.from(`${verifialiaUsername}:${verifialiaPassword}`).toString("base64");
        try {
            const response = yield fetch("https://api.verifalia.com/v2.7/email-validations", {
                method: "POST",
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/json",
                    "User-Agent": "Erlume/1.0",
                },
                body: JSON.stringify({
                    entries: emails.map((email) => ({ inputData: email })),
                }),
            });
            if (!response.ok) {
                const errorText = yield response.text();
                throw new Error(`Verifalia API error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data = yield response.json();
            // Extract results from the response
            // Verifalia v2.7 returns: { overview: {...}, entries: { data: [...] } }
            const results = {};
            if (((_a = data.entries) === null || _a === void 0 ? void 0 : _a.data) && Array.isArray(data.entries.data)) {
                data.entries.data.forEach((entry) => {
                    var _a;
                    const email = (_a = entry.inputData) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                    if (email) {
                        results[email] = {
                            Summary: {
                                Deliverability: entry.classification === "Deliverable"
                                    ? "Deliverable"
                                    : "Undeliverable",
                                Classification: entry.classification,
                            },
                            Diagnosis: entry.complaintLevel || null,
                        };
                    }
                });
            }
            console.log(`[Verifalia] Verified ${Object.keys(results).length} email(s)`);
            return results;
        }
        catch (error) {
            console.error("[Verifalia] API request failed:", error);
            throw error;
        }
    });
}
