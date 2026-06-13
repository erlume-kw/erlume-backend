// src/utils/zohoInvoice.ts
// Automatically creates a Zoho Invoice when an order is placed

const ZOHO_TOKEN_URL = "https://accounts.zoho.com/oauth/v2/token";
const ZOHO_API_BASE  = "https://www.zohoapis.com/invoice/v3";

// ─── Get a fresh access token using the stored refresh token ─────────────────

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
	// Return cached token if still valid (with 60s buffer)
	if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
		console.log("[zohoInvoice] Using cached token");
		return cachedToken.value;
	}

	const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;
	console.log("[zohoInvoice] Env check — CLIENT_ID:", !!ZOHO_CLIENT_ID, "SECRET:", !!ZOHO_CLIENT_SECRET, "REFRESH:", !!ZOHO_REFRESH_TOKEN);
	if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
		console.error("[zohoInvoice] Missing Zoho env vars — check .env file");
		return null;
	}

	try {
		const params = new URLSearchParams({
			grant_type:    "refresh_token",
			client_id:     ZOHO_CLIENT_ID,
			client_secret: ZOHO_CLIENT_SECRET,
			refresh_token: ZOHO_REFRESH_TOKEN,
		});

		console.log("[zohoInvoice] Requesting new access token…");
		const res  = await fetch(`${ZOHO_TOKEN_URL}?${params}`, { method: "POST" });
		const data = await res.json() as { access_token?: string; expires_in?: number; error?: string };

		if (!data.access_token) {
			console.error("[zohoInvoice] Failed to get access token:", JSON.stringify(data));
			return null;
		}

		cachedToken = {
			value:     data.access_token,
			expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
		};

		console.log("[zohoInvoice] Got new access token ✓");
		return cachedToken.value;
	} catch (err) {
		console.error("[zohoInvoice] Token refresh error:", err);
		return null;
	}
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceItem {
	name:     string;
	quantity: number;
	rate:     number; // KWD
}

export interface CreateInvoiceParams {
	orderId:       string;
	customerName:  string;
	phoneNumber:   string;
	email?:        string;
	items:         InvoiceItem[];
	totalAmount:   number; // KWD (after discount)
	discountRate?: number; // e.g. 30 for 30%
}

// ─── Create or find a contact in Zoho ─────────────────────────────────────────

const HEADERS = (token: string, orgId: string) => ({
	Authorization: `Zoho-oauthtoken ${token}`,
	"X-com-zoho-invoice-organizationid": orgId,
	"Content-Type": "application/json",
});

async function getOrCreateContact(
	token: string,
	orgId: string,
	name: string,
	phone: string,
	email?: string,
): Promise<string | null> {
	try {
		// Search by contact name first (more reliable than phone search)
		const searchRes = await fetch(
			`${ZOHO_API_BASE}/contacts?contact_name_contains=${encodeURIComponent(name)}&contact_type=customer`,
			{ headers: HEADERS(token, orgId) },
		);
		const searchData = await searchRes.json() as { contacts?: { contact_id: string; contact_name: string }[] };

		if (searchData.contacts && searchData.contacts.length > 0) {
			const contactId = searchData.contacts[0].contact_id;
			console.log(`[zohoInvoice] Found existing contact: ${searchData.contacts[0].contact_name} (${contactId})`);
			// Ensure the contact is active before using it
			await fetch(`${ZOHO_API_BASE}/contacts/${contactId}/active`, {
				method:  "POST",
				headers: HEADERS(token, orgId),
			});
			return contactId;
		}

		// Create new contact
		const body = {
			contact_name: name || phone || "Customer",
			contact_type: "customer",
			mobile:       phone || "",
			...(email ? { email } : {}),
		};

		console.log("[zohoInvoice] Creating contact:", body.contact_name);

		const createRes = await fetch(`${ZOHO_API_BASE}/contacts`, {
			method:  "POST",
			headers: HEADERS(token, orgId),
			body:    JSON.stringify(body),
		});

		const createData = await createRes.json() as { code?: number; message?: string; contact?: { contact_id: string } };

		if (createData.contact) {
			const contactId = createData.contact.contact_id;
			console.log("[zohoInvoice] Contact created:", contactId);
			await fetch(`${ZOHO_API_BASE}/contacts/${contactId}/active`, {
				method:  "POST",
				headers: HEADERS(token, orgId),
			});
			return contactId;
		}

		console.error("[zohoInvoice] Contact creation failed:", createData.code, createData.message);
		return null;
	} catch (err) {
		console.error("[zohoInvoice] Contact error:", err);
		return null;
	}
}

// ─── Main: create invoice ─────────────────────────────────────────────────────

const PORTAL_BASE = "https://invoice.zohosecure.com/portal/erlume/invoices";

export async function createZohoInvoice(params: CreateInvoiceParams): Promise<{ invoiceId: string; invoiceUrl: string } | null> {
	console.log("[zohoInvoice] createZohoInvoice called for order:", params.orderId);
	if (process.env.NODE_ENV === "test") return null;

	const orgId = process.env.ZOHO_ORG_ID;
	console.log("[zohoInvoice] ZOHO_ORG_ID:", orgId ?? "MISSING");
	if (!orgId) return null;

	const token = await getAccessToken();
	if (!token) return null;

	const contactId = await getOrCreateContact(
		token, orgId,
		params.customerName,
		params.phoneNumber,
		params.email,
	);

	if (!contactId) {
		console.error("[zohoInvoice] Could not get/create contact");
		return null;
	}

	// Build line items; if a discount rate is given, add it as a negative line
	const lineItems = params.items.map((item) => ({
		name:     item.name,
		quantity: item.quantity,
		rate:     item.rate,
	}));

	if (params.discountRate && params.discountRate > 0) {
		const subtotal     = params.items.reduce((s, i) => s + i.rate * i.quantity, 0);
		const discountAmt  = +(subtotal * params.discountRate / 100).toFixed(3);
		lineItems.push({
			name:     `Discount (${params.discountRate}%)`,
			quantity: 1,
			rate:     -discountAmt,
		});
	}

	const invoicePayload: Record<string, unknown> = {
		customer_id:      contactId,
		reference_number: params.orderId.slice(-8).toUpperCase(),
		currency_code:    "KWD",
		line_items:       lineItems,
	};

	try {
		const res = await fetch(`${ZOHO_API_BASE}/invoices`, {
			method:  "POST",
			headers: {
				Authorization: `Zoho-oauthtoken ${token}`,
				"X-com-zoho-invoice-organizationid": orgId,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(invoicePayload),
		});

		const data = await res.json() as {
			invoice?: {
				invoice_id:   string;
				invoice_number: string;
				invoice_url?: string; // direct shareable link returned by Zoho
			};
		};

		if (data.invoice) {
			const { invoice_id, invoice_number, invoice_url } = data.invoice;
			console.log(`[zohoInvoice] Raw invoice_url from API: ${invoice_url ?? "(none)"}`);
			const invoiceUrl = invoice_url ?? `${PORTAL_BASE}/${invoice_id}`;
			console.log(`[zohoInvoice] Created ${invoice_number} → ${invoiceUrl}`);

			// Send invoice email via Zoho if the customer has an email address
			if (params.email) {
				try {
					const emailRes = await fetch(`${ZOHO_API_BASE}/invoices/${invoice_id}/email`, {
						method:  "POST",
						headers: HEADERS(token, orgId),
						body:    JSON.stringify({
							to_mail_ids:             [params.email],
							subject:                 `Your Invoice from Erlume — ${invoice_number}`,
							body:                    `Dear ${params.customerName},\n\nPlease find your invoice ${invoice_number} attached.\n\nThank you for shopping with Erlume.\n\nWarm regards,\nErlume Team`,
							send_customer_statement: false,
							send_attachment:         true,
						}),
					});
					const emailData = await emailRes.json() as { code: number; message: string };
					if (emailData.code === 0) {
						console.log(`[zohoInvoice] Invoice emailed to ${params.email}`);
					} else {
						console.warn(`[zohoInvoice] Email send failed:`, emailData.message);
					}
				} catch (err) {
					console.error("[zohoInvoice] Email send error:", err);
				}
			}

			return { invoiceId: invoice_id, invoiceUrl };
		}

		console.error("[zohoInvoice] Create invoice failed:", data);
		return null;
	} catch (err) {
		console.error("[zohoInvoice] Create invoice error:", err);
		return null;
	}
}
