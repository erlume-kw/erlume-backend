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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../config/db"));
const Employee_1 = __importDefault(require("../models/Employee"));
const User_1 = __importDefault(require("../models/User"));
const Seller_1 = __importDefault(require("../models/Seller"));
const Item_1 = __importDefault(require("../models/Item"));
const Category_1 = __importDefault(require("../models/Category"));
const Sale_1 = __importDefault(require("../models/Sale"));
const Expense_1 = __importDefault(require("../models/Expense"));
const Income_1 = __importDefault(require("../models/Income"));
const expenseEnums_1 = require("../enums/expenseEnums");
const itemEnums_1 = require("../enums/itemEnums");
const statusEnums_1 = require("../enums/statusEnums");
const sellerEnums_1 = require("../enums/sellerEnums");
// ─── Paths ────────────────────────────────────────────────────────────────────
const DATA_DIR = process.env.AIRTABLE_DIR ||
    path.join(process.env.USERPROFILE || process.env.HOME || "", "Desktop", "erlume airtable data");
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
const DEFAULT_PASSWORD_HASH = bcryptjs_1.default.hashSync("Erlume@2025", 10);
// ─── CSV Parsing ──────────────────────────────────────────────────────────────
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
function splitCsvRows(content) {
    const rows = [];
    const rawLines = content.split(/\r?\n/);
    let i = 0;
    while (i < rawLines.length) {
        let line = rawLines[i++];
        let qc = (line.match(/"/g) || []).length;
        while (qc % 2 === 1 && i < rawLines.length) {
            line += "\n" + rawLines[i++];
            qc = (line.match(/"/g) || []).length;
        }
        if (line.trim())
            rows.push(line);
    }
    return rows;
}
function loadCsv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`  [CSV] Not found: ${filePath}`);
        return [];
    }
    const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, ""); // strip BOM
    const lines = splitCsvRows(raw);
    if (lines.length < 2)
        return [];
    const header = parseCsvLine(lines[0]);
    return lines.slice(1).map((line) => {
        const cells = parseCsvLine(line);
        const row = {};
        header.forEach((h, j) => { var _a; row[h.trim()] = ((_a = cells[j]) !== null && _a !== void 0 ? _a : "").trim(); });
        return row;
    });
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
const stripKwd = (s) => (s || "").replace(/^KWD\s*/i, "").trim();
function parseMonthDate(s) {
    if (!s)
        return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), 1);
}
function parseDate(s) {
    if (!s)
        return null;
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
function extractUrl(field) {
    const m = (field || "").match(/\((https?:\/\/[^)]+)\)/);
    return m ? m[1] : "";
}
/** Extract all URLs from a field (handles multiple per cell) */
function extractAllUrls(field) {
    const urls = [];
    const re = /\((https?:\/\/[^)]+)\)/g;
    let m;
    while ((m = re.exec(field || "")) !== null)
        urls.push(m[1]);
    return urls;
}
/** Strip non-digit/non-plus chars from phone for User model */
function normalizePhone(raw) {
    return (raw || "").replace(/[\s\-(). ]/g, "");
}
function isChecked(val) {
    const v = (val || "").toLowerCase().trim();
    return v === "checked" || v === "1" || v === "yes" || v === "true";
}
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/** Best-effort parse of free-form Kuwait address string into required Address subdoc */
function parseAddress(raw) {
    var _a, _b;
    const s = (raw || "").trim();
    const blockMatch = s.match(/block\s+(\w+)/i) || s.match(/\bbl?\.?\s*(\d+)/i);
    const streetMatch = s.match(/str(?:eet)?\s+(\w+)/i) ||
        s.match(/\bst\.?\s+(\d+)/i) ||
        s.match(/شارع\s*(\d+)/);
    const houseMatch = s.match(/house\s+(\w+)/i) || s.match(/منزل\s+(\w+)/);
    const flatMatch = s.match(/apt\.?\s+(\w+)/i) ||
        s.match(/flat\s+(\w+)/i) ||
        s.match(/floor\s+(\w+)/i);
    // City = first comma-separated segment, first word
    const city = ((_b = (_a = s.split(",")[0]) === null || _a === void 0 ? void 0 : _a.trim().split(/\s+/)[0]) === null || _b === void 0 ? void 0 : _b.trim()) || "Kuwait City";
    return {
        street: (streetMatch === null || streetMatch === void 0 ? void 0 : streetMatch[1]) || "1",
        city,
        block: (blockMatch === null || blockMatch === void 0 ? void 0 : blockMatch[1]) || "1",
        governorate: "Kuwait",
        house: (houseMatch === null || houseMatch === void 0 ? void 0 : houseMatch[1]) || "1",
        flat: flatMatch === null || flatMatch === void 0 ? void 0 : flatMatch[1],
    };
}
function mapExpenseType(csvType) {
    const t = (csvType || "").trim().toLowerCase();
    if (t.includes("subscriptions") && t.includes("services"))
        return [expenseEnums_1.ExpenseType.SubscriptionsServices];
    if (t.includes("subscriptions"))
        return [expenseEnums_1.ExpenseType.Subscriptions];
    if (t.includes("services"))
        return [expenseEnums_1.ExpenseType.Services];
    if (t.includes("supplies"))
        return [expenseEnums_1.ExpenseType.Supplies];
    return [expenseEnums_1.ExpenseType.Services];
}
// ─── Importers ────────────────────────────────────────────────────────────────
function importEmployees() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = loadCsv(CSV.salaries);
        let created = 0;
        for (const r of rows) {
            const name = (r["Employee name"] || "").trim();
            if (!name)
                continue;
            if (yield Employee_1.default.findOne({ name }))
                continue;
            const photoRaw = (r["Photo"] || "").trim();
            const photo = extractUrl(photoRaw) || photoRaw.split(" ")[0] || undefined;
            yield Employee_1.default.create({
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
    });
}
/**
 * Import prelaunch sellers → User (role: seller) + Seller profile.
 * Returns a map of sellerName → userId for later item linking.
 */
function importSellerUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = loadCsv(CSV.sellers);
        const nameToUserId = new Map();
        let usersCreated = 0;
        let sellersCreated = 0;
        for (const r of rows) {
            const fullName = (r["Full Name"] || "").trim();
            if (!fullName)
                continue;
            const rawEmail = (r["Email Address"] || "").trim();
            const phone = normalizePhone(r["Phone Number"] || "");
            const addressRaw = (r["Address"] || "").trim();
            const consentGiven = (r["Consent"] || "").toLowerCase().includes("yes") ||
                (r["Consent"] || "") === "true";
            const preferredPickup = (r["Pickup Date"] || "").replace(/^no need$/i, "").trim();
            const intakeTimestamp = (r["Timestamp"] || "").trim();
            // Placeholder email for sellers who didn't provide one
            const safeEmail = rawEmail ||
                `seller_${fullName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}@erlume.internal`;
            let userId;
            const existing = yield User_1.default.findOne({ emailAddress: safeEmail, isDeleted: false });
            if (existing) {
                userId = existing._id;
            }
            else {
                const addr = parseAddress(addressRaw);
                const created = yield User_1.default.create({
                    password: DEFAULT_PASSWORD_HASH,
                    emailAddress: safeEmail,
                    phoneNumber: phone || "00000000",
                    address: addr,
                    roles: ["seller"],
                });
                userId = created._id;
                usersCreated++;
            }
            nameToUserId.set(fullName, userId);
            if (!(yield Seller_1.default.findOne({ userId }))) {
                yield Seller_1.default.create({
                    userId,
                    fullName,
                    emailAddress: rawEmail || undefined,
                    addressText: addressRaw || undefined,
                    balance: "0",
                    consentGiven,
                    preferredPickupDate: preferredPickup || undefined,
                    intakeTimestamp: intakeTimestamp || undefined,
                    onboardingStatus: sellerEnums_1.SellerOnboardingStatus.GoogleFormSubmitted,
                    itemsOnboardingStatus: sellerEnums_1.ItemsOnboardingStatus.NoItems,
                });
                sellersCreated++;
            }
        }
        console.log(`  [Sellers]      ${usersCreated} users + ${sellersCreated} seller profiles created`);
        return nameToUserId;
    });
}
function importBuyerUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = loadCsv(CSV.buyers);
        let created = 0;
        for (const r of rows) {
            const fullName = (r["Full Name"] || "").trim();
            const rawEmail = (r["Email"] || "").trim();
            const phone = normalizePhone(r["Phone Number"] || "");
            if (!rawEmail && !phone)
                continue;
            const safeEmail = rawEmail ||
                `buyer_${fullName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}@erlume.internal`;
            if (yield User_1.default.findOne({ emailAddress: safeEmail, isDeleted: false }))
                continue;
            const addr = parseAddress((r["Address"] || "").trim());
            yield User_1.default.create({
                password: DEFAULT_PASSWORD_HASH,
                emailAddress: safeEmail,
                phoneNumber: phone || "00000000",
                address: addr,
                roles: ["buyer"],
            });
            created++;
        }
        return created;
    });
}
function getOrCreateBagsCategory() {
    return __awaiter(this, void 0, void 0, function* () {
        let cat = yield Category_1.default.findOne({ name: "Bags" });
        if (!cat)
            cat = yield Category_1.default.create({ name: "Bags", base_rate: "0" });
        return cat._id;
    });
}
function importItems(nameToUserId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const rows = loadCsv(CSV.bags);
        const categoryId = yield getOrCreateBagsCategory();
        let created = 0;
        for (const r of rows) {
            const bagRef = (r["Bag"] || "").trim();
            const brand = (r["Brand"] || "").trim();
            const modelName = (r["Model"] || "").trim();
            const year = (r["Year"] || "").trim();
            if (!bagRef && !brand)
                continue;
            // Prefer the full Model column name; fall back to extracting from Bag reference key
            const itemName = modelName || ((_a = bagRef.split("-")[0]) === null || _a === void 0 ? void 0 : _a.trim()) || bagRef;
            // Skip duplicates
            if (brand &&
                (yield Item_1.default.findOne({
                    itemName: new RegExp(escapeRegex(itemName), "i"),
                    brandName: new RegExp(escapeRegex(brand), "i"),
                })))
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
            const newItem = yield Item_1.default.create({
                itemName,
                brandName: brand || "Unknown",
                itemModel: modelName || undefined,
                year: year || undefined,
                imageUrls,
                receiptPhotoUrls: receiptPhotoUrls.length ? receiptPhotoUrls : undefined,
                priceEstimatorUrls: priceEstimatorUrls.length ? priceEstimatorUrls : undefined,
                quoteUrls: quoteUrls.length ? quoteUrls : undefined,
                listingPrice: listingPrice || "0",
                basePrice: listingPrice || "0",
                saleRate: "0",
                condition: itemEnums_1.ItemCondition.GentlyUsed,
                itemStatus: approved ? statusEnums_1.ItemStatus.Approved : statusEnums_1.ItemStatus.Pending,
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
                yield Seller_1.default.findOneAndUpdate({ userId: sellerId }, { $addToSet: { itemIds: newItem._id } });
            }
        }
        return created;
    });
}
function importSales() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = loadCsv(CSV.sales);
        let created = 0;
        for (const r of rows) {
            const bagRecord = (r["Bag Record"] || "").trim();
            const buyer = (r["Buyer Record"] || "").trim();
            const amountRaw = r["Total Amount Paid"] || r["Listing Price (from Bag Record)"] || "";
            const amount = stripKwd(amountRaw);
            if (!bagRecord && !amount && !buyer)
                continue;
            const listingPrice = stripKwd(r["Listing Price (from Bag Record)"] || "");
            const status = (r["Status"] || "Confirmed").trim();
            const saleDate = parseDate(r["Date"] || "");
            const invoiceUrl = extractUrl(r["Invoice (from Invoice)"] || "") ||
                extractUrl(r["Customer Invoice"] || "");
            const paymentEvidenceUrl = extractUrl(r["Payment Evidence"] || "");
            if (yield Sale_1.default.findOne({
                bag_record: bagRecord || undefined,
                buyer: buyer || undefined,
                amount: amount || undefined,
            }))
                continue;
            yield Sale_1.default.create({
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
    });
}
function importExpenses() {
    return __awaiter(this, void 0, void 0, function* () {
        const rows = loadCsv(CSV.expenses);
        let created = 0;
        for (const r of rows) {
            const name = (r["Name"] || "").trim();
            const cost = stripKwd(r["Cost"] || "");
            if (!name || !cost)
                continue;
            const month = parseMonthDate(r["Month"] || "");
            if (!month)
                continue;
            const typeArr = mapExpenseType(r["Type"] || "");
            const notes = (r["Notes"] || "").replace(/\n/g, " ").trim();
            if (yield Expense_1.default.findOne({ name, cost, month }))
                continue;
            yield Expense_1.default.create({
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
    });
}
function importIncome() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const rows = loadCsv(CSV.income);
        let created = 0;
        for (const r of rows) {
            const amount = stripKwd(r["Income"] || "");
            if (!amount)
                continue;
            const month = parseMonthDate(r["Month"] || "");
            const platform = (r["Platform"] || "").replace(/[^\w\s]/g, "").trim() || "Online";
            const prelaunchBag = (r["prelaunch bags"] || "").trim();
            if (yield Income_1.default.findOne({
                amount,
                month: month || undefined,
                platform,
                prelaunch_bag: prelaunchBag || undefined,
            }))
                continue;
            // Resolve item_id from the first bag reference in the comma-separated list
            let item_id;
            if (prelaunchBag) {
                const firstRef = (_a = prelaunchBag.split(",")[0]) === null || _a === void 0 ? void 0 : _a.trim();
                if (firstRef) {
                    const parts = firstRef.split("-").map((p) => p.trim()).filter(Boolean);
                    if (parts.length >= 2) {
                        const itemNamePart = parts[0];
                        const last = parts[parts.length - 1];
                        const isYear = /^\d{4}$/.test(last);
                        const brand = isYear && parts.length >= 3
                            ? parts[parts.length - 2]
                            : parts[parts.length - 1];
                        const found = yield Item_1.default.findOne({
                            itemName: new RegExp(escapeRegex(itemNamePart), "i"),
                            brandName: new RegExp(escapeRegex(brand), "i"),
                        })
                            .select("_id")
                            .lean();
                        if (found)
                            item_id = found._id;
                    }
                }
            }
            yield Income_1.default.create({
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
    });
}
// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.default)();
        if (process.argv.includes("--clear")) {
            console.log("Clearing existing imported data...");
            yield Promise.all([
                Employee_1.default.deleteMany({}),
                Sale_1.default.deleteMany({}),
                Expense_1.default.deleteMany({}),
                Income_1.default.deleteMany({}),
                Item_1.default.deleteMany({}),
                Seller_1.default.deleteMany({}),
                User_1.default.deleteMany({ roles: { $in: ["seller", "buyer"] } }),
            ]);
            console.log("Cleared.\n");
        }
        console.log(`Importing from: ${DATA_DIR}\n`);
        const empCount = yield importEmployees();
        console.log(`  [Employees]    ${empCount} created`);
        const nameToUserId = yield importSellerUsers();
        const buyerCount = yield importBuyerUsers();
        console.log(`  [Buyers]       ${buyerCount} users created`);
        const itemCount = yield importItems(nameToUserId);
        console.log(`  [Items]        ${itemCount} created`);
        const saleCount = yield importSales();
        console.log(`  [Sales]        ${saleCount} created`);
        const expCount = yield importExpenses();
        console.log(`  [Expenses]     ${expCount} created`);
        const incCount = yield importIncome();
        console.log(`  [Income]       ${incCount} created`);
        console.log(`\nAll done.`);
        yield mongoose_1.default.disconnect();
        process.exit(0);
    });
}
main().catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
});
