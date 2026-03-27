/**
 * One-off / repeatable: remove x-usedBy, x-audience-convention, and admin/backoffice/login wording from openapi.json.
 * Run: node scripts/strip-openapi-audience.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const openApiPath = path.join(root, "openapi.json");
const raw = fs.readFileSync(openApiPath, "utf8");
const spec = JSON.parse(raw);

delete spec["x-audience-convention"];

spec.info = spec.info || {};
spec.info.description =
	"REST API for Erlume. Use this spec for documentation, code generation, or API clients. All IDs are MongoDB ObjectIds unless noted. List endpoints support date filters (year, month) where applicable.";

if (Array.isArray(spec.servers) && spec.servers[1]) {
	spec.servers[1].description = "Relative (use your API base URL)";
}

function transform(value) {
	if (Array.isArray(value)) {
		return value.map(transform);
	}
	if (value !== null && typeof value === "object") {
		const out = {};
		for (const [k, v] of Object.entries(value)) {
			if (k === "x-usedBy") continue;
			out[k] = transform(v);
		}
		return out;
	}
	if (typeof value === "string") {
		return value
			.replace(
				/User accounts only \(login, roles, soft-delete\)/g,
				"User accounts (roles, soft-delete)",
			)
			.replace(
				/Set true to soft-delete user\. Backoffice uses this for Delete button\./g,
				"Set true to soft-delete the user account.",
			)
			.replace(
				/Delete user \(hard\)\. Backoffice uses PATCH with isDeleted for soft delete\./g,
				"Delete user (hard). Prefer PATCH with isDeleted for soft delete.",
			)
			.replace(/\bBackoffice\b/g, "Client app")
			.replace(/\bbackoffice\b/g, "client")
			.replace(/\badmin dashboard\b/gi, "internal tooling")
			.replace(/\bAdmin dashboard\b/g, "Internal tooling");
	}
	return value;
}

const next = transform(spec);
fs.writeFileSync(openApiPath, JSON.stringify(next, null, 2) + "\n", "utf8");
console.log("Updated", openApiPath);
