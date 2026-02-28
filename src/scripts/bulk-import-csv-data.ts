/**
 * Bulk import: Salaries (Employees), Prelaunch Sales, Expenses, Income from CSV files.
 * Run: npx ts-node src/scripts/bulk-import-csv-data.ts
 *       npx ts-node src/scripts/bulk-import-csv-data.ts --clear   (delete existing imported data first)
 * CSV paths (default: Downloads): SALARIES_CSV, PRELAUNCH_SALES_CSV, EXPENSES_CSV, INCOME_CSV
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";

import connectDB from "../config/db";
import Employee from "../models/Employee";
import Sale from "../models/Sale";
import Expense from "../models/Expense";
import Income from "../models/Income";
import Item from "../models/Item";
import { ExpenseType } from "../enums/expenseEnums";

const DOWNLOADS = path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads");
const SALARIES_CSV = process.env.SALARIES_CSV || path.join(DOWNLOADS, "Salaries-All salaries.csv");
const PRELAUNCH_SALES_CSV = process.env.PRELAUNCH_SALES_CSV || path.join(DOWNLOADS, "prelaunch sales-Grid view.csv");
const EXPENSES_CSV = process.env.EXPENSES_CSV || path.join(DOWNLOADS, "Expenses-All expenses.csv");
const INCOME_CSV = process.env.INCOME_CSV || path.join(DOWNLOADS, "Income-In-store income.csv");

/** Parse CSV line respecting quoted fields (handles commas and newlines inside quotes) */
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

/** Split CSV content into logical rows (handles newlines inside quoted fields) */
function splitCsvRows(content: string): string[] {
	const rows: string[] = [];
	const rawLines = content.split(/\r?\n/);
	let i = 0;
	while (i < rawLines.length) {
		let line = rawLines[i];
		i++;
		// If line has odd number of quotes, merge with next lines until balanced
		let qc = (line.match(/"/g) || []).length;
		while (qc % 2 === 1 && i < rawLines.length) {
			line += "\n" + rawLines[i];
			i++;
			qc = (line.match(/"/g) || []).length;
		}
		if (line.trim()) rows.push(line);
	}
	return rows;
}

function loadCsv(filePath: string): Record<string, string>[] {
	if (!fs.existsSync(filePath)) {
		console.warn(`[CSV] Not found: ${filePath}`);
		return [];
	}
	const raw = fs.readFileSync(filePath, "utf-8");
	const lines = splitCsvRows(raw);
	if (lines.length < 2) return [];
	const header = parseCsvLine(lines[0]);
	const rows: Record<string, string>[] = [];
	for (let i = 1; i < lines.length; i++) {
		const cells = parseCsvLine(lines[i]);
		const row: Record<string, string> = {};
		header.forEach((h, j) => {
			row[h] = (cells[j] ?? "").trim();
		});
		rows.push(row);
	}
	return rows;
}

function stripKwd(s: string): string {
	if (!s) return "";
	return s.replace(/^KWD\s*/i, "").trim();
}

function parseMonthDate(s: string): Date | null {
	if (!s) return null;
	const d = new Date(s);
	if (isNaN(d.getTime())) return null;
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

function parseDate(s: string): Date | null {
	if (!s) return null;
	// Handle "8/30/2025" format
	const parts = s.split("/");
	if (parts.length === 3) {
		const m = parseInt(parts[0], 10);
		const day = parseInt(parts[1], 10);
		const y = parseInt(parts[2], 10);
		if (m >= 1 && m <= 12 && day >= 1 && day <= 31 && y > 1900) {
			return new Date(y, m - 1, day);
		}
	}
	const d = new Date(s);
	return isNaN(d.getTime()) ? null : d;
}

/** Extract first URL from field like "filename (https://url)" */
function extractUrl(field: string): string {
	if (!field) return "";
	const m = field.match(/\((https?:\/\/[^\)]+)\)/);
	return m ? m[1] : field;
}

/** Parse item ref string "Name-Brand-Year" into { model, brand }. Works for any product type (bags, clothing, etc.). */
function parseItemRef(itemRef: string): { model: string; brand: string } | null {
	const s = (itemRef || "").trim();
	if (!s) return null;
	const parts = s.split("-").map((p: string) => p.trim()).filter(Boolean);
	if (parts.length < 2) return null;
	// Last part is year if 4 digits
	const last = parts[parts.length - 1];
	const isYear = /^\d{4}$/.test(last);
	const model = parts[0];
	const brand = isYear && parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1];
	return { model, brand };
}

/** Find Item by reference string (matches itemName + brandName). Works for any product type. */
async function findItemByRef(itemRef: string): Promise<mongoose.Types.ObjectId | null> {
	const parsed = parseItemRef(itemRef);
	if (!parsed) return null;
	const { model, brand } = parsed;
	if (!model || !brand) return null;
	// Match Item where itemName contains model and brandName contains brand
	const item = await Item.findOne({
		itemName: new RegExp(escapeRegex(model), "i"),
		brandName: new RegExp(escapeRegex(brand), "i"),
	}).select("_id").lean();
	const id = item?._id;
	return id ? (id as mongoose.Types.ObjectId) : null;
}

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Map CSV expense type to enum value(s) - Expense.type is array */
function mapExpenseType(csvType: string): string[] {
	const t = (csvType || "").trim().toLowerCase();
	if (t === "supplies") return [ExpenseType.Supplies];
	if (t === "subscriptions") return [ExpenseType.Subscriptions];
	if (t === "services") return [ExpenseType.Services];
	if (t === "subscriptions,services") return [ExpenseType.SubscriptionsServices];
	// Try normalized
	const norm = csvType?.trim();
	if (norm === "Subscriptions,Services") return [ExpenseType.SubscriptionsServices];
	return [ExpenseType.Services]; // fallback
}

async function importEmployees(): Promise<number> {
	const rows = loadCsv(SALARIES_CSV);
	if (rows.length === 0) return 0;
	let created = 0;
	for (const r of rows) {
		const name = r["Employee name"] || "";
		if (!name) continue;
		const existing = await Employee.findOne({ name });
		if (existing) continue;
		const photo = (r["Photo"] || "").trim();
		const photoVal = photo ? extractUrl(photo) || photo.split(" ")[0] || photo : undefined;
		await Employee.create({
			name,
			photo: photoVal || undefined,
			role: r["Role"] || undefined,
			type: r["Type"] || undefined,
			salaryActual: stripKwd(r["2019 salary (actual)"] || ""),
			salaryProjected: stripKwd(r["2019 salary (projected)"] || ""),
		});
		created++;
	}
	return created;
}

async function importPrelaunchSales(): Promise<number> {
	const rows = loadCsv(PRELAUNCH_SALES_CSV);
	if (rows.length === 0) return 0;
	let created = 0;
	for (const r of rows) {
		const bagRecord = r["Bag Record"] || "";
		const amount = r["Total Amount Paid"] || r["Listing Price (from Bag Record)"] || "";
		const buyer = r["Buyer Record"] || "";
		const status = r["Status"] || "";
		if (!bagRecord && !amount && !buyer) continue; // skip empty rows
		const listingPrice = (r["Listing Price (from Bag Record)"] || "").replace(/^KWD\s*/i, "").trim();
		const amt = stripKwd(amount) || listingPrice;
		const saleDate = parseDate(r["Date"] || "");
		const existing = await Sale.findOne({
			bag_record: bagRecord || undefined,
			buyer: buyer || undefined,
			amount: amt || undefined,
			sale_date: saleDate || undefined,
		});
		if (existing) continue;
		const invoiceCol = r["Invoice (from Invoice)"] || r["Customer Invoice"] || "";
		const payCol = r["Payment Evidence"] || "";
		const invoiceUrl = extractUrl(invoiceCol) || extractUrl(r["Customer Invoice"] || "");
		const paymentEvidenceUrl = extractUrl(payCol);
		await Sale.create({
			amount: amt || undefined,
			listingPrice: listingPrice || undefined,
			buyer: buyer || undefined,
			status: status || "Confirmed",
			sale_date: saleDate || undefined,
			bag_record: bagRecord || undefined,
			invoice_url: invoiceUrl || undefined,
			payment_evidence_url: paymentEvidenceUrl || undefined,
		});
		created++;
	}
	return created;
}

async function importExpenses(): Promise<number> {
	const rows = loadCsv(EXPENSES_CSV);
	if (rows.length === 0) return 0;
	let created = 0;
	for (const r of rows) {
		const name = r["Name"] || "";
		if (!name) continue;
		const cost = stripKwd(r["Cost"] || "");
		if (!cost) continue;
		const month = parseMonthDate(r["Month"] || "");
		if (!month) continue;
		const csvType = r["Type"] || "";
		const typeArr = mapExpenseType(csvType);
		const notes = (r["Notes"] || "").replace(/\n/g, " ").trim();
		const existing = await Expense.findOne({ name, cost, month, type: typeArr });
		if (existing) continue;
		await Expense.create({
			name,
			cost,
			currency: "KWD",
			notes: notes || undefined,
			type: typeArr,
			month,
			paidBy: r["Paid By"] || undefined,
			isRecurring: (r["Recurring?"] || "").toLowerCase() === "yes" || (r["Recurring?"] || "").toLowerCase() === "true",
			phase: r["Phase"] || undefined,
		});
		created++;
	}
	return created;
}

async function importIncome(): Promise<number> {
	const rows = loadCsv(INCOME_CSV);
	if (rows.length === 0) return 0;
	let created = 0;
	let linked = 0;
	for (const r of rows) {
		const amount = stripKwd(r["Income"] || "");
		if (!amount) continue;
		const month = parseMonthDate(r["Month"] || "");
		const platform = (r["Platform"] || "").replace(/[^\w\s]/g, "").trim() || "Online";
		const prelaunchBag = (r["prelaunch bags"] || "").trim();
		const existing = await Income.findOne({
			amount,
			month: month || undefined,
			platform,
			prelaunch_bag: prelaunchBag || undefined,
		});
		if (existing) continue;
		// Resolve item_id from prelaunch refs: use first if comma-separated (any product type)
		let item_id: mongoose.Types.ObjectId | undefined;
		if (prelaunchBag) {
			const firstRef = prelaunchBag.split(",")[0]?.trim() || prelaunchBag;
			const found = await findItemByRef(firstRef);
			if (found) {
				item_id = found;
				linked++;
			}
		}
		await Income.create({
			amount,
			month: month || undefined,
			platform: platform || undefined,
			prelaunch_bag: prelaunchBag || undefined,
			item_id: item_id || undefined,
			income_type: "sale",
		});
		created++;
	}
	if (linked > 0) {
		console.log(`  [Income] Linked ${linked} incomes to items`);
	}
	return created;
}

async function main(): Promise<void> {
	await connectDB();

	const clearFirst = process.argv.includes("--clear");
	if (clearFirst) {
		console.log("Clearing existing imported data...");
		await Promise.all([
			Employee.deleteMany({}),
			Sale.deleteMany({}),
			Expense.deleteMany({}),
			Income.deleteMany({}),
		]);
		console.log("Cleared.");
	}

	console.log("Importing from CSVs...");
	console.log(`  Salaries: ${SALARIES_CSV}`);
	console.log(`  Prelaunch Sales: ${PRELAUNCH_SALES_CSV}`);
	console.log(`  Expenses: ${EXPENSES_CSV}`);
	console.log(`  Income: ${INCOME_CSV}`);

	const [empCount, saleCount, expCount, incCount] = await Promise.all([
		importEmployees(),
		importPrelaunchSales(),
		importExpenses(),
		importIncome(),
	]);

	// Backfill: link existing incomes (prelaunch ref set, item_id missing) to items
	const unlinkedIncomes = await Income.find({
		prelaunch_bag: { $exists: true, $ne: "" },
		$or: [{ item_id: { $exists: false } }, { item_id: null }],
	});
	let linkedCount = 0;
	for (const inc of unlinkedIncomes) {
		const firstRef = (inc.prelaunch_bag || "").split(",")[0]?.trim();
		if (!firstRef) continue;
		const itemId = await findItemByRef(firstRef);
		if (itemId) {
			await Income.findByIdAndUpdate(inc._id, { $set: { item_id: itemId } });
			linkedCount++;
		}
	}
	if (linkedCount > 0) {
		console.log(`  [Backfill] Linked ${linkedCount} existing incomes to items`);
	}

	console.log(`\nDone. Created: ${empCount} employees, ${saleCount} sales, ${expCount} expenses, ${incCount} incomes.`);

	await mongoose.disconnect();
	process.exit(0);
}

main().catch((err) => {
	console.error("Import failed:", err);
	process.exit(1);
});
