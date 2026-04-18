/**
 * Import all Airtable CSV exports into MongoDB.
 *
 * Handles:
 *   Salaries           → Employee
 *   prelaunch sellers  → User (role: seller) + Seller
 *   prelaunch buyers   → User (role: buyer)
 *   prelaunch bags     → Item  (linked to sellers, auto-creates "Bags" category)
 *   prelaunch sales    → Sale
 *   Expenses           → Expense
 *   Income             → Income  (item_id linked via prelaunch_bag reference)
 *
 * Run:
 *   npx ts-node src/scripts/import-airtable-all.ts
 *   npx ts-node src/scripts/import-airtable-all.ts --clear   (wipe first)
 *
 * Override CSV folder:
 *   set AIRTABLE_DIR=<path>
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";

import connectDB from "../config/db";
import Employee from "../models/Employee";
import User from "../models/User";
import Seller from "../models/Seller";
import Item from "../models/Item";
import Category from "../models/Category";
import Sale from "../models/Sale";
import Expense from "../models/Expense";
import Income from "../models/Income";
import { ExpenseType } from "../enums/expenseEnums";
import { ItemCondition } from "../enums/itemEnums";
import { ItemStatus } from "../enums/statusEnums";
import {
	SellerOnboardingStatus,
	ItemsOnboardingStatus,
} from "../enums/sellerEnums";

// ─── Paths ────────────────────────────────────────────────────────────────────
const DATA_DIR =
	process.env.AIRTABLE_DIR ||
	path.join(
		process.env.USERPROFILE || process.env.HOME || "",
		"Desktop",
		"erlume airtable data",
	);

const CSV = {
	salaries: path.join(DATA_DIR, "Salaries-All salaries (1).csv"),
	sellers: path.join(DATA_DIR, "prelaunch sellers-Grid view.csv"),
	buyers: path.join(DATA_DIR, "prelaunch buyers-Grid view.csv"),
	bags: path.join(DATA_DIR, "prelaunch bags-Grid view (1).csv"),
	sales: path.join(DATA_DIR, "prelaunch sales-Grid view (1).csv"),
	expenses: path.join(DATA_DIR, "Expenses-All expenses (1).csv"),
	income: path.join(DATA_DIR, "Income-All income.csv"),
};

// Single bcrypt hash reused for all imported users (password: Erlume@2025)
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("Erlume@2025", 10);

// ─── CSV Parsing ──────────────────────────────────────────────────────────────
function parseCsvLine(line: string): string[] {
	const out: string[] = [];
	let i = 0;
	while (i < line.length) {
		if (line[i] === '"') {
			let end = i + 1;
			while (end < line.length) {
				const next = line.indexOf('"', end);
				if (next === -1) break;
				if (line[next + 1] === '"') {
					end = next + 2;
					continue;
				}
				end = next;
				break;
			}
			out.push(line.slice(i + 1, end).replace(/""/g, '"'));
			i = end + 1;
			if (line[i] === ",") i++;
			continue;
		}
		const comma = line.indexOf(",", i);
		if (comma === -1) {
			out.push(line.slice(i).trim());
			break;
		}
		out.push(line.slice(i, comma).trim());
		i = comma + 1;
	}
	return out;
}

function splitCsvRows(content: string): string[] {
	const rows: string[] = [];
	const rawLines = content.split(/\r?\n/);
	let i = 0;
	while (i < rawLines.length) {
		let line = rawLines[i++];
		let qc = (line.match(/"/g) || []).length;
		while (qc % 2 === 1 && i < rawLines.length) {
			line += "\n" + rawLines[i++];
			qc = (line.match(/"/g) || []).length;
		}
		if (line.trim()) rows.push(line);
	}
	return rows;
}

function loadCsv(filePath: string): Record<string, string>[] {
	if (!fs.existsSync(filePath)) {
		console.warn(`  [CSV] Not found: ${filePath}`);
		return [];
	}
	const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, ""); // strip BOM
	const lines = splitCsvRows(raw);
	if (lines.length < 2) return [];
	const header = parseCsvLine(lines[0]);
	return lines.slice(1).map((line) => {
		const cells = parseCsvLine(line);
		const row: Record<string, string> = {};
		header.forEach((h, j) => {
			row[h.trim()] = (cells[j] ?? "").trim();
		});
		return row;
	});
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const stripKwd = (s: string) => (s || "").replace(/^KWD\s*/i, "").trim();

function parseMonthDate(s: string): Date | null {
	if (!s) return null;
	const d = new Date(s);
	return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), 1);
}

function parseDate(s: string): Date | null {
	if (!s) return null;
	const parts = s.split("/");
	if (parts.length === 3) {
		const [m, day, y] = parts.map(Number);
		if (m >= 1 && m <= 12 && day >= 1 && day <= 31 && y > 1900)
			return new Date(y, m - 1, day);
	}
	const d = new Date(s);
	return isNaN(d.getTime()) ? null : d;
}

/** Extract first URL from "filename (https://...)" pattern */
function extractUrl(field: string): string {
	const m = (field || "").match(/\((https?:\/\/[^)]+)\)/);
	return m ? m[1] : "";
}

/** Extract all URLs from a field (handles multiple per cell) */
function extractAllUrls(field: string): string[] {
	const urls: string[] = [];
	const re = /\((https?:\/\/[^)]+)\)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(field || "")) !== null) urls.push(m[1]);
	return urls;
}

/** Strip non-digit/non-plus chars from phone for User model */
function normalizePhone(raw: string): string {
	return (raw || "").replace(/[\s\-(). ]/g, "");
}

function isChecked(val: string): boolean {
	const v = (val || "").toLowerCase().trim();
	return v === "checked" || v === "1" || v === "yes" || v === "true";
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Best-effort parse of free-form Kuwait address string into required Address subdoc */
function parseAddress(raw: string): {
	street: string;
	city: string;
	block: string;
	governorate: string;
	house: string;
	flat?: string;
} {
	const s = (raw || "").trim();
	const blockMatch = s.match(/block\s+(\w+)/i) || s.match(/\bbl?\.?\s*(\d+)/i);
	const streetMatch =
		s.match(/str(?:eet)?\s+(\w+)/i) ||
		s.match(/\bst\.?\s+(\d+)/i) ||
		s.match(/شارع\s*(\d+)/);
	const houseMatch = s.match(/house\s+(\w+)/i) || s.match(/منزل\s+(\w+)/);
	const flatMatch =
		s.match(/apt\.?\s+(\w+)/i) ||
		s.match(/flat\s+(\w+)/i) ||
		s.match(/floor\s+(\w+)/i);

	// City = first comma-separated segment, first word
	const city = s.split(",")[0]?.trim().split(/\s+/)[0]?.trim() || "Kuwait City";

	return {
		street: streetMatch?.[1] || "1",
		city,
		block: blockMatch?.[1] || "1",
		governorate: "Kuwait",
		house: houseMatch?.[1] || "1",
		flat: flatMatch?.[1],
	};
}

function mapExpenseType(csvType: string): string[] {
	const t = (csvType || "").trim().toLowerCase();
	if (t.includes("subscriptions") && t.includes("services"))
		return [ExpenseType.SubscriptionsServices];
	if (t.includes("subscriptions")) return [ExpenseType.Subscriptions];
	if (t.includes("services")) return [ExpenseType.Services];
	if (t.includes("supplies")) return [ExpenseType.Supplies];
	return [ExpenseType.Services];
}

// ─── Importers ────────────────────────────────────────────────────────────────

async function importEmployees(): Promise<number> {
	const rows = loadCsv(CSV.salaries);
	let created = 0;
	for (const r of rows) {
		const name = (r["Employee name"] || "").trim();
		if (!name) continue;
		if (await Employee.findOne({ name })) continue;
		const photoRaw = (r["Photo"] || "").trim();
		const photo = extractUrl(photoRaw) || photoRaw.split(" ")[0] || undefined;
		await Employee.create({
			name,
			photo: photo || undefined,
			role: r["Role"] || undefined,
			type: r["Type"] || undefined,
			salaryActual: stripKwd(r["2019 salary (actual)"] || ""),
			salaryProjected: stripKwd(r["2019 salary (projected)"] || ""),
		});
		created++;
	}
	return created;
}

/**
 * Import prelaunch sellers → User (role: seller) + Seller profile.
 * Returns a map of sellerName → userId for later item linking.
 */
async function importSellerUsers(): Promise<
	Map<string, mongoose.Types.ObjectId>
> {
	const rows = loadCsv(CSV.sellers);
	const nameToUserId = new Map<string, mongoose.Types.ObjectId>();
	let usersCreated = 0;
	let sellersCreated = 0;

	for (const r of rows) {
		const fullName = (r["Full Name"] || "").trim();
		if (!fullName) continue;

		const rawEmail = (r["Email Address"] || "").trim();
		const phone = normalizePhone(r["Phone Number"] || "");
		const addressRaw = (r["Address"] || "").trim();
		const consentGiven =
			(r["Consent"] || "").toLowerCase().includes("yes") ||
			(r["Consent"] || "") === "true";
		const preferredPickup = (r["Pickup Date"] || "")
			.replace(/^no need$/i, "")
			.trim();
		const intakeTimestamp = (r["Timestamp"] || "").trim();

		// Placeholder email for sellers who didn't provide one
		const safeEmail =
			rawEmail ||
			`seller_${fullName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}@erlume.internal`;

		let userId: mongoose.Types.ObjectId;
		const existing = await User.findOne({
			emailAddress: safeEmail,
			isDeleted: false,
		});
		if (existing) {
			userId = existing._id as mongoose.Types.ObjectId;
		} else {
			const addr = parseAddress(addressRaw);
			const created = await User.create({
				password: DEFAULT_PASSWORD_HASH,
				emailAddress: safeEmail,
				phoneNumber: phone || "00000000",
				address: addr,
				roles: ["seller"],
			});
			userId = created._id as mongoose.Types.ObjectId;
			usersCreated++;
		}

		nameToUserId.set(fullName, userId);

		if (!(await Seller.findOne({ userId }))) {
			await Seller.create({
				userId,
				fullName,
				emailAddress: rawEmail || undefined,
				addressText: addressRaw || undefined,
				balance: "0",
				consentGiven,
				preferredPickupDate: preferredPickup || undefined,
				intakeTimestamp: intakeTimestamp || undefined,
				onboardingStatus: SellerOnboardingStatus.GoogleFormSubmitted,
				itemsOnboardingStatus: ItemsOnboardingStatus.NoItems,
			});
			sellersCreated++;
		}
	}

	console.log(
		`  [Sellers]      ${usersCreated} users + ${sellersCreated} seller profiles created`,
	);
	return nameToUserId;
}

async function importBuyerUsers(): Promise<number> {
	const rows = loadCsv(CSV.buyers);
	let created = 0;
	for (const r of rows) {
		const fullName = (r["Full Name"] || "").trim();
		const rawEmail = (r["Email"] || "").trim();
		const phone = normalizePhone(r["Phone Number"] || "");
		if (!rawEmail && !phone) continue;

		const safeEmail =
			rawEmail ||
			`buyer_${fullName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}@erlume.internal`;

		if (await User.findOne({ emailAddress: safeEmail, isDeleted: false }))
			continue;

		const addr = parseAddress((r["Address"] || "").trim());
		await User.create({
			password: DEFAULT_PASSWORD_HASH,
			emailAddress: safeEmail,
			phoneNumber: phone || "00000000",
			address: addr,
			roles: ["buyer"],
		});
		created++;
	}
	return created;
}

async function getOrCreateBagsCategory(): Promise<mongoose.Types.ObjectId> {
	let cat = await Category.findOne({ name: "Bags" });
	if (!cat) cat = await Category.create({ name: "Bags", base_rate: "0" });
	return cat._id as mongoose.Types.ObjectId;
}

async function importItems(
	nameToUserId: Map<string, mongoose.Types.ObjectId>,
): Promise<number> {
	const rows = loadCsv(CSV.bags);
	const categoryId = await getOrCreateBagsCategory();
	let created = 0;

	for (const r of rows) {
		const bagRef = (r["Bag"] || "").trim();
		const brand = (r["Brand"] || "").trim();
		const modelName = (r["Model"] || "").trim();
		const year = (r["Year"] || "").trim();
		if (!bagRef && !brand) continue;

		// Prefer the full Model column name; fall back to extracting from Bag reference key
		const itemName = modelName || bagRef.split("-")[0]?.trim() || bagRef;

		// Skip duplicates
		if (
			brand &&
			(await Item.findOne({
				itemName: new RegExp(escapeRegex(itemName), "i"),
				brandName: new RegExp(escapeRegex(brand), "i"),
			}))
		)
			continue;

		const imageUrls = extractAllUrls(r["Photo"] || "");
		const receiptPhotoUrls = extractAllUrls(r["Receipt Photo"] || "");
		const priceEstimatorUrls = extractAllUrls(r["Price Estimator"] || "");
		const quoteUrls = extractAllUrls(r["Quote"] || "");

		const sellerName = (r["prelaunch sellers"] || "").trim();
		const sellerId = sellerName ? nameToUserId.get(sellerName) : undefined;

		const listingPrice = stripKwd(r["Listing Price"] || "");
		const approved = isChecked(r["Approved"] || "");
		const approvedNextDrop = isChecked(r["Approved Next Drop"] || "");
		const authNeeded = isChecked(r["Auth Needed"] || "");
		const cleaningNeeded = isChecked(r["Cleaning needed"] || "");
		const photographed = isChecked(r["photographed"] || "");

		const newItem = await Item.create({
			itemName,
			brandName: brand || "Unknown",
			itemModel: modelName || undefined,
			year: year || undefined,
			imageUrls,
			receiptPhotoUrls: receiptPhotoUrls.length ? receiptPhotoUrls : undefined,
			priceEstimatorUrls: priceEstimatorUrls.length
				? priceEstimatorUrls
				: undefined,
			quoteUrls: quoteUrls.length ? quoteUrls : undefined,
			listingPrice: listingPrice || "0",
			basePrice: listingPrice || "0",
			saleRate: "0",
			condition: ItemCondition.GentlyUsed,
			itemStatus: approved ? ItemStatus.Approved : ItemStatus.Pending,
			color: "Unknown",
			size: "Unknown",
			quantity: "1",
			uploadedAt: new Date(),
			category_id: categoryId,
			seller_id: sellerId || undefined,
			approved,
			approvedNextDrop,
			authNeeded,
			cleaningNeeded,
			photographed,
		});
		created++;

		// Add item to Seller's itemIds
		if (sellerId) {
			await Seller.findOneAndUpdate(
				{ userId: sellerId },
				{ $addToSet: { itemIds: newItem._id } },
			);
		}
	}
	return created;
}

async function importSales(): Promise<number> {
	const rows = loadCsv(CSV.sales);
	let created = 0;
	for (const r of rows) {
		const bagRecord = (r["Bag Record"] || "").trim();
		const buyer = (r["Buyer Record"] || "").trim();
		const amountRaw =
			r["Total Amount Paid"] || r["Listing Price (from Bag Record)"] || "";
		const amount = stripKwd(amountRaw);
		if (!bagRecord && !amount && !buyer) continue;

		const listingPrice = stripKwd(r["Listing Price (from Bag Record)"] || "");
		const status = (r["Status"] || "Confirmed").trim();
		const saleDate = parseDate(r["Date"] || "");
		const invoiceUrl =
			extractUrl(r["Invoice (from Invoice)"] || "") ||
			extractUrl(r["Customer Invoice"] || "");
		const paymentEvidenceUrl = extractUrl(r["Payment Evidence"] || "");

		if (
			await Sale.findOne({
				bag_record: bagRecord || undefined,
				buyer: buyer || undefined,
				amount: amount || undefined,
			})
		)
			continue;

		await Sale.create({
			bag_record: bagRecord || undefined,
			buyer: buyer || undefined,
			amount: amount || undefined,
			listingPrice: listingPrice || undefined,
			status,
			sale_date: saleDate || undefined,
			invoice_url: invoiceUrl || undefined,
			payment_evidence_url: paymentEvidenceUrl || undefined,
		});
		created++;
	}
	return created;
}

async function importExpenses(): Promise<number> {
	const rows = loadCsv(CSV.expenses);
	let created = 0;
	for (const r of rows) {
		const name = (r["Name"] || "").trim();
		const cost = stripKwd(r["Cost"] || "");
		if (!name || !cost) continue;
		const month = parseMonthDate(r["Month"] || "");
		if (!month) continue;
		const typeArr = mapExpenseType(r["Type"] || "");
		const notes = (r["Notes"] || "").replace(/\n/g, " ").trim();
		if (await Expense.findOne({ name, cost, month })) continue;
		await Expense.create({
			name,
			cost,
			currency: "KWD",
			notes: notes || undefined,
			type: typeArr,
			month,
			paidBy: r["Paid By"] || undefined,
			isRecurring: isChecked(r["Recurring?"] || ""),
			phase: r["Phase"] || undefined,
		});
		created++;
	}
	return created;
}

async function importIncome(): Promise<number> {
	const rows = loadCsv(CSV.income);
	let created = 0;
	for (const r of rows) {
		const amount = stripKwd(r["Income"] || "");
		if (!amount) continue;
		const month = parseMonthDate(r["Month"] || "");
		const platform =
			(r["Platform"] || "").replace(/[^\w\s]/g, "").trim() || "Online";
		const prelaunchBag = (r["prelaunch bags"] || "").trim();

		if (
			await Income.findOne({
				amount,
				month: month || undefined,
				platform,
				prelaunch_bag: prelaunchBag || undefined,
			})
		)
			continue;

		// Resolve item_id from the first bag reference in the comma-separated list
		let item_id: mongoose.Types.ObjectId | undefined;
		if (prelaunchBag) {
			const firstRef = prelaunchBag.split(",")[0]?.trim();
			if (firstRef) {
				const parts = firstRef
					.split("-")
					.map((p) => p.trim())
					.filter(Boolean);
				if (parts.length >= 2) {
					const itemNamePart = parts[0];
					const last = parts[parts.length - 1];
					const isYear = /^\d{4}$/.test(last);
					const brand =
						isYear && parts.length >= 3
							? parts[parts.length - 2]
							: parts[parts.length - 1];
					const found = await Item.findOne({
						itemName: new RegExp(escapeRegex(itemNamePart), "i"),
						brandName: new RegExp(escapeRegex(brand), "i"),
					})
						.select("_id")
						.lean();
					if (found) item_id = found._id as mongoose.Types.ObjectId;
				}
			}
		}

		await Income.create({
			amount,
			month: month || undefined,
			platform,
			prelaunch_bag: prelaunchBag || undefined,
			item_id: item_id || undefined,
			income_type: "sale",
			currency: "KWD",
		});
		created++;
	}
	return created;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
	await connectDB();

	if (process.argv.includes("--clear")) {
		console.log("Clearing existing imported data...");
		await Promise.all([
			Employee.deleteMany({}),
			Sale.deleteMany({}),
			Expense.deleteMany({}),
			Income.deleteMany({}),
			Item.deleteMany({}),
			Seller.deleteMany({}),
			User.deleteMany({ roles: { $in: ["seller", "buyer"] } }),
		]);
		console.log("Cleared.\n");
	}

	console.log(`Importing from: ${DATA_DIR}\n`);

	const empCount = await importEmployees();
	console.log(`  [Employees]    ${empCount} created`);

	const nameToUserId = await importSellerUsers();

	const buyerCount = await importBuyerUsers();
	console.log(`  [Buyers]       ${buyerCount} users created`);

	const itemCount = await importItems(nameToUserId);
	console.log(`  [Items]        ${itemCount} created`);

	const saleCount = await importSales();
	console.log(`  [Sales]        ${saleCount} created`);

	const expCount = await importExpenses();
	console.log(`  [Expenses]     ${expCount} created`);

	const incCount = await importIncome();
	console.log(`  [Income]       ${incCount} created`);

	console.log(`\nAll done.`);
	await mongoose.disconnect();
	process.exit(0);
}

main().catch((err) => {
	console.error("Import failed:", err);
	process.exit(1);
});
