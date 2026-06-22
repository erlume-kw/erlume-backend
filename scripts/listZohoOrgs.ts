// Run: npx ts-node scripts/listZohoOrgs.ts
import "dotenv/config";

async function main() {
	const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;

	if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
		console.error("Missing Zoho env vars");
		process.exit(1);
	}

	// Get access token
	const params = new URLSearchParams({
		grant_type:    "refresh_token",
		client_id:     ZOHO_CLIENT_ID,
		client_secret: ZOHO_CLIENT_SECRET,
		refresh_token: ZOHO_REFRESH_TOKEN,
	});
	const tokenRes  = await fetch(`https://accounts.zoho.com/oauth/v2/token?${params}`, { method: "POST" });
	const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

	if (!tokenData.access_token) {
		console.error("Token error:", tokenData);
		process.exit(1);
	}

	console.log("Token OK ✓");

	// List organizations — no org ID header needed
	const orgsRes  = await fetch("https://www.zohoapis.com/invoice/v3/organizations", {
		headers: { Authorization: `Zoho-oauthtoken ${tokenData.access_token}` },
	});
	const orgsData = await orgsRes.json() as { organizations?: { organization_id: string; name: string; is_default_org: boolean }[]; message?: string };

	if (!orgsData.organizations) {
		console.error("No orgs returned:", orgsData);
		process.exit(1);
	}

	console.log("\nYour Zoho Invoice organizations:");
	for (const org of orgsData.organizations) {
		console.log(`  ID: ${org.organization_id}  Name: ${org.name}  Default: ${org.is_default_org}`);
	}
}

main().catch(console.error);
