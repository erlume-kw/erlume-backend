"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
/**
 * Bulk import: Salaries (Employees), Prelaunch Sales, Expenses, Income from CSV files.
 * Run: npx ts-node src/scripts/bulk-import-csv-data.ts
 *       npx ts-node src/scripts/bulk-import-csv-data.ts --clear   (delete existing imported data first)
 * CSV paths (default: Downloads): SALARIES_CSV, PRELAUNCH_SALES_CSV, EXPENSES_CSV, INCOME_CSV
 */
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const db_1 = __importDefault(require("../config/db"));
const Employee_1 = __importDefault(require("../models/Employee"));
const Sale_1 = __importDefault(require("../models/Sale"));
const Expense_1 = __importDefault(require("../models/Expense"));
const Income_1 = __importDefault(require("../models/Income"));
const Item_1 = __importDefault(require("../models/Item"));
const expenseEnums_1 = require("../enums/expenseEnums");
const DOWNLOADS = path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads");
const SALARIES_CSV = process.env.SALARIES_CSV || path.join(DOWNLOADS, "Salaries-All salaries.csv");
const PRELAUNCH_SALES_CSV = process.env.PRELAUNCH_SALES_CSV || path.join(DOWNLOADS, "prelaunch sales-Grid view.csv");
const EXPENSES_CSV = process.env.EXPENSES_CSV || path.join(DOWNLOADS, "Expenses-All expenses.csv");
const INCOME_CSV = process.env.INCOME_CSV || path.join(DOWNLOADS, "Income-In-store income.csv");
/** Parse CSV line respecting quoted fields (handles commas and newlines inside quotes) */
function parseCsvLine(line) {
    const out = [];
    let i = 0;
    while (i < line.length) {
        if (line[i] === '"') {
            let end = i + 1;
            while (end < line.length) {
                const next = line.indexOf('"', end);
                if (next === -1)
                    break;
                if (line[next + 1] === '"') {
                    end = next + 2;
                    continue;
                }
                end = next;
                break;
            }
            out.push(line.slice(i + 1, end).replace(/""/g, '"'));
            i = end + 1;
            if (line[i] === ",")
                i++;
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
function splitCsvRows(content) {
    const rows = [];
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
        if (line.trim())
            rows.push(line);
    }
    return rows;
}
function loadCsv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`[CSV] Not found: ${filePath}`);
        return [];
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const lines = splitCsvRows(raw);
    if (lines.length < 2)
        return [];
    const header = parseCsvLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        const row = {};
        header.forEach((h, j) => {
            var _a;
            row[h] = ((_a = cells[j]) !== null && _a !== void 0 ? _a : "").trim();
        });
        rows.push(row);
    }
    return rows;
}
function stripKwd(s) {
    if (!s)
        return "";
    return s.replace(/^KWD\s*/i, "").trim();
}
function parseMonthDate(s) {
    if (!s)
        return null;
    const d = new Date(s);
    if (isNaN(d.getTime()))
        return null;
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function parseDate(s) {
    if (!s)
        return null;
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
function extractUrl(field) {
    if (!field)
        return "";
    const m = field.match(/\((https?:\/\/[^\)]+)\)/);
    return m ? m[1] : field;
}
/** Parse item ref string "Name-Brand-Year" into { model, brand }. Works for any product type (bags, clothing, etc.). */
function parseItemRef(itemRef) {
    const s = (itemRef || "").trim();
    if (!s)
        return null;
    const parts = s.split("-").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2)
        return null;
    // Last part is year if 4 digits
    const last = parts[parts.length - 1];
    const isYear = /^\d{4}$/.test(last);
    const model = parts[0];
    const brand = isYear && parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1];
    return { model, brand };
}
/** Find Item by reference string (matches itemName + brandName). Works for any product type. */
function findItemByRef(itemRef) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsed = parseItemRef(itemRef);
        if (!parsed)
            return null;
        const { model, brand } = parsed;
        if (!model || !brand)
            return null;
        // Match Item where itemName contains model and brandName contains brand
        const item = yield Item_1.default.findOne({
            itemName: new RegExp(escapeRegex(model), "i"),
            brandName: new RegExp(escapeRegex(brand), "i"),
        }).select("_id").lean();
        const id = item === null || item === void 0 ? void 0 : item._id;
        return id ? id : null;
    });
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/** Map CSV expense type to enum value(s) - Expense.type is array */
function mapExpenseType(csvType) {
    const t = (csvType || "").trim().toLowerCase();
    if (t === "supplies")
        return [expenseEnums_1.ExpenseType.Supplies];
    if (t === "subscriptions")
        return [expenseEnums_1.ExpenseType.Subscriptions];
    if (t === "services")
        return [expenseEnums_1.ExpenseType.Services];
    if (t === "subscriptions,services")
        return [expenseEnums_1.ExpenseType.SubscriptionsServices];
    // Try normalized
    const norm = csvType === null || csvType === void 0 ? void 0 : csvType.trim();
    if (norm === "Subscriptions,Services")
        return [expenseEnums_1.ExpenseType.SubscriptionsServices];
    return [expenseEnums_1.ExpenseType.Services]; // fallback
}
function importEmployees() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = loadCsv(SALARIES_CSV);
        if (rows.length === 0)
            return 0;
        let created = 0;
        for (const r of rows) {
            const name = r["Employee name"] || "";
            if (!name)
                continue;
            const existing = yield Employee_1.default.findOne({ name });
            if (existing)
                continue;
            const photo = (r["Photo"] || "").trim();
            const photoVal = photo ? extractUrl(photo) || photo.split(" ")[0] || photo : undefined;
            yield Employee_1.default.create({
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
    });
}
function importPrelaunchSales() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = loadCsv(PRELAUNCH_SALES_CSV);
        if (rows.length === 0)
            return 0;
        let created = 0;
        for (const r of rows) {
            const bagRecord = r["Bag Record"] || "";
            const amount = r["Total Amount Paid"] || r["Listing Price (from Bag Record)"] || "";
            const buyer = r["Buyer Record"] || "";
            const status = r["Status"] || "";
            if (!bagRecord && !amount && !buyer)
                continue; // skip empty rows
            const listingPrice = (r["Listing Price (from Bag Record)"] || "").replace(/^KWD\s*/i, "").trim();
            const amt = stripKwd(amount) || listingPrice;
            const saleDate = parseDate(r["Date"] || "");
            const existing = yield Sale_1.default.findOne({
                bag_record: bagRecord || undefined,
                buyer: buyer || undefined,
                amount: amt || undefined,
                sale_date: saleDate || undefined,
            });
            if (existing)
                continue;
            const invoiceCol = r["Invoice (from Invoice)"] || r["Customer Invoice"] || "";
            const payCol = r["Payment Evidence"] || "";
            const invoiceUrl = extractUrl(invoiceCol) || extractUrl(r["Customer Invoice"] || "");
            const paymentEvidenceUrl = extractUrl(payCol);
            yield Sale_1.default.create({
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
    });
}
function importExpenses() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = loadCsv(EXPENSES_CSV);
        if (rows.length === 0)
            return 0;
        let created = 0;
        for (const r of rows) {
            const name = r["Name"] || "";
            if (!name)
                continue;
            const cost = stripKwd(r["Cost"] || "");
            if (!cost)
                continue;
            const month = parseMonthDate(r["Month"] || "");
            if (!month)
                continue;
            const csvType = r["Type"] || "";
            const typeArr = mapExpenseType(csvType);
            const notes = (r["Notes"] || "").replace(/\n/g, " ").trim();
            const existing = yield Expense_1.default.findOne({ name, cost, month, type: typeArr });
            if (existing)
                continue;
            yield Expense_1.default.create({
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
    });
}
function importIncome() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const rows = loadCsv(INCOME_CSV);
        if (rows.length === 0)
            return 0;
        let created = 0;
        let linked = 0;
        for (const r of rows) {
            const amount = stripKwd(r["Income"] || "");
            if (!amount)
                continue;
            const month = parseMonthDate(r["Month"] || "");
            const platform = (r["Platform"] || "").replace(/[^\w\s]/g, "").trim() || "Online";
            const prelaunchBag = (r["prelaunch bags"] || "").trim();
            const existing = yield Income_1.default.findOne({
                amount,
                month: month || undefined,
                platform,
                prelaunch_bag: prelaunchBag || undefined,
            });
            if (existing)
                continue;
            // Resolve item_id from prelaunch refs: use first if comma-separated (any product type)
            let item_id;
            if (prelaunchBag) {
                const firstRef = ((_a = prelaunchBag.split(",")[0]) === null || _a === void 0 ? void 0 : _a.trim()) || prelaunchBag;
                const found = yield findItemByRef(firstRef);
                if (found) {
                    item_id = found;
                    linked++;
                }
            }
            yield Income_1.default.create({
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
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield (0, db_1.default)();
        const clearFirst = process.argv.includes("--clear");
        if (clearFirst) {
            console.log("Clearing existing imported data...");
            yield Promise.all([
                Employee_1.default.deleteMany({}),
                Sale_1.default.deleteMany({}),
                Expense_1.default.deleteMany({}),
                Income_1.default.deleteMany({}),
            ]);
            console.log("Cleared.");
        }
        console.log("Importing from CSVs...");
        console.log(`  Salaries: ${SALARIES_CSV}`);
        console.log(`  Prelaunch Sales: ${PRELAUNCH_SALES_CSV}`);
        console.log(`  Expenses: ${EXPENSES_CSV}`);
        console.log(`  Income: ${INCOME_CSV}`);
        const [empCount, saleCount, expCount, incCount] = yield Promise.all([
            importEmployees(),
            importPrelaunchSales(),
            importExpenses(),
            importIncome(),
        ]);
        // Backfill: link existing incomes (prelaunch ref set, item_id missing) to items
        const unlinkedIncomes = yield Income_1.default.find({
            prelaunch_bag: { $exists: true, $ne: "" },
            $or: [{ item_id: { $exists: false } }, { item_id: null }],
        });
        let linkedCount = 0;
        for (const inc of unlinkedIncomes) {
            const firstRef = (_a = (inc.prelaunch_bag || "").split(",")[0]) === null || _a === void 0 ? void 0 : _a.trim();
            if (!firstRef)
                continue;
            const itemId = yield findItemByRef(firstRef);
            if (itemId) {
                yield Income_1.default.findByIdAndUpdate(inc._id, { $set: { item_id: itemId } });
                linkedCount++;
            }
        }
        if (linkedCount > 0) {
            console.log(`  [Backfill] Linked ${linkedCount} existing incomes to items`);
        }
        console.log(`\nDone. Created: ${empCount} employees, ${saleCount} sales, ${expCount} expenses, ${incCount} incomes.`);
        yield mongoose_1.default.disconnect();
        process.exit(0);
    });
}
main().catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
});
