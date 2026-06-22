// src/services/verificationService.ts

import Newsletter from "../models/Newsletter";
import Notification from "../models/Notification";

interface VerifialiaResponse {
	Data: {
		[email: string]: {
			_id?: string;
			Summary?: {
				Deliverability: string;
				Classification: string;
			};
			Diagnosis?: string;
		};
	};
	Meta?: {
		RequestTimestamp?: string;
	};
}

/**
 * Batch verify emails from the last 24 hours (newsletter + notifications)
 * Called once daily at 5 PM GMT+3 (Asia/Kuwait timezone)
 * Verifies all emails that signed up within the 24-hour window before job execution
 * Example: Job at June 22, 5 PM → verifies emails from June 21, 5 PM to June 22, 5 PM
 */
export async function batchVerifyEmails(): Promise<void> {
	try {
		console.log("[Verifalia] Starting batch email verification...");

		// Calculate 24 hours ago from now
		const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		console.log(`[Verifalia] Verifying emails from last 24 hours (since ${oneDayAgo.toISOString()})`);

		// Collect pending emails from the last 24 hours from both collections
		const pendingNewsletters = await Newsletter.find({
			verificationStatus: "pending",
			isActive: true,
			subscribedAt: { $gte: oneDayAgo },
		}).select("email");

		const pendingNotifications = await Notification.find({
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
		const results = await sendBatchToVerifalia(emailsArray);

		// Update Newsletter records
		for (const newsletter of pendingNewsletters) {
			const result = results[newsletter.email];
			if (result) {
				const isValid = result.Summary?.Deliverability === "Deliverable";
				newsletter.verificationStatus = isValid ? "valid" : "invalid";
				newsletter.verifiedAt = new Date();
				newsletter.verifialiaDiagnostics = result.Diagnosis || null;
				await newsletter.save();
			}
		}

		// Update Notification records
		for (const notification of pendingNotifications) {
			const result = results[notification.email];
			if (result) {
				const isValid = result.Summary?.Deliverability === "Deliverable";
				notification.verificationStatus = isValid ? "valid" : "invalid";
				notification.verifiedAt = new Date();
				notification.verifialiaDiagnostics = result.Diagnosis || null;
				await notification.save();
			}
		}

		console.log("[Verifalia] Batch verification complete");
	} catch (error) {
		console.error("[Verifalia] Error during batch verification:", error);
		throw error;
	}
}

/**
 * Send batch of emails to Verifalia for verification
 */
async function sendBatchToVerifalia(emails: string[]): Promise<Record<string, any>> {
	const verifialiaUsername = process.env.VERIFALIA_USERNAME || "info@erlume.com.kw";
	const verifialiaPassword = process.env.VERIFALIA_PASSWORD || "Erlume965$";

	if (!verifialiaUsername || !verifialiaPassword) {
		throw new Error("Verifalia credentials not configured in environment");
	}

	// Create Basic Auth header
	const auth = Buffer.from(`${verifialiaUsername}:${verifialiaPassword}`).toString("base64");

	try {
		const response = await fetch("https://api.verifalia.com/v2.7/email-validations", {
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
			const errorText = await response.text();
			throw new Error(`Verifalia API error: ${response.status} ${response.statusText} - ${errorText}`);
		}

		const data = await response.json();

		// Extract results from the response
		// Verifalia v2.7 returns: { overview: {...}, entries: { data: [...] } }
		const results: Record<string, any> = {};
		if (data.entries?.data && Array.isArray(data.entries.data)) {
			data.entries.data.forEach((entry: any) => {
				const email = entry.inputData?.toLowerCase();
				if (email) {
					results[email] = {
						Summary: {
							Deliverability:
								entry.classification === "Deliverable"
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
	} catch (error) {
		console.error("[Verifalia] API request failed:", error);
		throw error;
	}
}
