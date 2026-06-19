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

// ─── Email template ──────────────────────────────────────────────────────────

function buildInvoiceEmail(customerName: string, invoiceNumber: string, invoiceUrl: string): string {
	const year = new Date().getFullYear();
	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f0ede3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" style="max-width:520px;width:100%;background:#faf9f5;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(17,29,17,0.07);">

        <!-- Brand name -->
        <tr>
          <td style="padding:36px 40px 28px;border-bottom:1px solid #e4e8e4;">
            <span style="font-size:22px;font-weight:300;letter-spacing:5px;color:#111d11;text-transform:uppercase;">ERLUME</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 20px;font-size:16px;font-weight:500;color:#111d11;">Hi ${customerName},</p>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.75;color:#5a6b5a;">
              Thank you for your order! Your invoice <strong style="color:#111d11;">${invoiceNumber}</strong> is attached to this email.
            </p>
            <p style="margin:0 0 28px;font-size:14px;line-height:1.75;color:#5a6b5a;">
              You can also view and download it anytime using the link below.
            </p>

            <a href="${invoiceUrl}" style="display:inline-block;background:#111d11;color:#faf9f5;text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.5px;padding:13px 30px;border-radius:6px;">View Invoice</a>
          </td>
        </tr>

        <!-- Contact -->
        <tr>
          <td style="padding:24px 40px;background:#f0ede3;border-top:1px solid #e4e8e4;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#111d11;">Need help?</p>
            <p style="margin:0 0 6px;font-size:13px;color:#5a6b5a;">
              📧 <a href="mailto:info@erlume.com.kw" style="color:#3d6b3d;text-decoration:none;">info@erlume.com.kw</a>
            </p>
            <p style="margin:0;font-size:13px;color:#5a6b5a;">
              💬 <a href="https://wa.me/96597226735" style="color:#3d6b3d;text-decoration:none;">WhatsApp +965 97226735</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#c3ccc3;">&copy; ${year} Erlume · erlume.com.kw</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

			// Send invoice PDF via Resend
			if (params.email) {
				try {
					const { Resend } = await import("resend");
					const resend = new Resend(process.env.RESEND_API_KEY);
					const from   = process.env.RESEND_FROM ?? "orders@erlume.com.kw";

					// Download PDF from Zoho
					const pdfRes = await fetch(`${ZOHO_API_BASE}/invoices/${invoice_id}?accept=pdf`, {
						headers: HEADERS(token, orgId),
					});
					const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());

					const { error } = await resend.emails.send({
						from,
						to:      [params.email],
						subject: `Your Invoice from Erlume — ${invoice_number}`,
						html: buildInvoiceEmail(params.customerName, invoice_number, invoiceUrl),
						attachments: [{
							filename: `${invoice_number}.pdf`,
							content:  pdfBuffer,
						}],
					});

					if (error) {
						console.warn("[zohoInvoice] Resend email failed:", error.message);
					} else {
						console.log(`[zohoInvoice] Invoice emailed via Resend to ${params.email}`);
					}
				} catch (err) {
					console.error("[zohoInvoice] Resend email error:", err);
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
