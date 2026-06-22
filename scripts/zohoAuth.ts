/**
 * Regenerate Zoho Invoice refresh token.
 *
 * Steps:
 *   1. Go to https://api-console.zoho.com
 *   2. Open your client → "Edit" → add http://localhost:8080/callback to Redirect URIs → Save
 *   3. Run:  npx ts-node scripts/zohoAuth.ts
 *   4. A browser tab opens — approve access
 *   5. The new ZOHO_REFRESH_TOKEN is printed here — paste it into .env
 */
import "dotenv/config";
import http from "http";
import { exec } from "child_process";

const CLIENT_ID     = process.env.ZOHO_CLIENT_ID!;
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET!;
const REDIRECT_URI  = "http://localhost:4321/callback";
const SCOPES        = "ZohoInvoice.fullaccess.all";

if (!CLIENT_ID || !CLIENT_SECRET) {
	console.error("ZOHO_CLIENT_ID or ZOHO_CLIENT_SECRET missing in .env");
	process.exit(1);
}

const authUrl =
	`https://accounts.zoho.com/oauth/v2/auth?` +
	`scope=${encodeURIComponent(SCOPES)}&` +
	`client_id=${CLIENT_ID}&` +
	`response_type=code&` +
	`access_type=offline&` +
	`redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

console.log("\nOpening browser for Zoho authorization…");
console.log("If it doesn't open, visit:\n");
console.log(authUrl);
console.log();

// Open browser (Windows)
exec(`start "" "${authUrl}"`);

// Local server to capture the code
const server = http.createServer(async (req, res) => {
	const url  = new URL(req.url!, `http://localhost:8080`);
	const code = url.searchParams.get("code");

	if (!code) {
		res.writeHead(400); res.end("No code found");
		return;
	}

	res.writeHead(200, { "Content-Type": "text/html" });
	res.end("<html><body style='font-family:sans-serif;padding:40px'><h2>Authorization successful ✓</h2><p>You can close this tab.</p></body></html>");

	server.close();

	// Exchange code for tokens
	const params = new URLSearchParams({
		grant_type:   "authorization_code",
		client_id:    CLIENT_ID,
		client_secret: CLIENT_SECRET,
		redirect_uri: REDIRECT_URI,
		code,
	});

	const tokenRes  = await fetch(`https://accounts.zoho.com/oauth/v2/token?${params}`, { method: "POST" });
	const tokenData = await tokenRes.json() as {
		access_token?:  string;
		refresh_token?: string;
		api_domain?:    string;
		error?:         string;
	};

	if (!tokenData.refresh_token) {
		console.error("Token exchange failed:", tokenData);
		process.exit(1);
	}

	console.log("=".repeat(60));
	console.log("SUCCESS — add this to your .env:\n");
	console.log(`ZOHO_REFRESH_TOKEN=${tokenData.refresh_token}`);
	console.log("=".repeat(60));

	// Also list orgs so we can confirm the correct org ID
	const orgsRes  = await fetch("https://www.zohoapis.com/invoice/v3/organizations", {
		headers: { Authorization: `Zoho-oauthtoken ${tokenData.access_token}` },
	});
	const orgsData = await orgsRes.json() as {
		organizations?: { organization_id: string; name: string; is_default_org: boolean }[];
	};

	if (orgsData.organizations?.length) {
		console.log("\nYour Zoho Invoice organizations:");
		for (const org of orgsData.organizations) {
			console.log(`  ID: ${org.organization_id}  Name: "${org.name}"  Default: ${org.is_default_org}`);
		}
		console.log("\nPaste the correct ZOHO_ORG_ID into .env too.");
	}

	process.exit(0);
});

server.listen(4321, () => {
	console.log("Waiting for Zoho callback on http://localhost:4321/callback …");
});
