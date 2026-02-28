"use strict";
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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Item_1 = __importDefault(require("../models/Item"));
const Seller_1 = __importDefault(require("../models/Seller"));
const User_1 = __importDefault(require("../models/User"));
const Category_1 = __importDefault(require("../models/Category"));
const itemEnums_1 = require("../enums/itemEnums");
const statusEnums_1 = require("../enums/statusEnums");
dotenv_1.default.config();
// CSV path: set BULK_IMPORT_CSV_PATH or use default (Downloads prelaunch CSV)
const DEFAULT_CSV_PATH = path_1.default.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads", "prelaunch bags-Grid view.csv");
const CSV_PATH = process.env.BULK_IMPORT_CSV_PATH || DEFAULT_CSV_PATH;
/** Items you already have in the system — these rows will be skipped when importing from CSV. */
const ALREADY_HAVE_ITEMS = [
    { brandName: "Bottega Veneta", name: "Brick Cassette" },
    { brandName: "Louis Vuitton", name: "Onthego PM" },
    { brandName: "Louis Vuitton", name: "Speedy Soft 30" },
    { brandName: "Louis Vuitton", name: "Emilie Wallet" },
    { brandName: "Louis Vuitton", name: "District PM Dam" },
    { brandName: "Pedro", name: "Men's Clutch" },
    { brandName: "Fendi", name: "Beauty Case Bug" },
    { brandName: "Louis Vuitton", name: "Men's Toiletry" },
    { brandName: "Kenzo", name: "Men's Backpack" },
    { brandName: "Fendi", name: "Fendi Red Leath" },
    { brandName: "Givenchy", name: "Antigona bag in" },
    { brandName: "Saint Laurent (YSL)", name: "SAC DE JOUR in" },
    { brandName: "Vasilis & Roxani", name: "Knitted bag" },
    { brandName: "Versace", name: "Versace Black C" },
    { brandName: "Georgio Armani", name: "Navy Velvet Tot" },
    { brandName: "Michael Kors", name: "Leather Trim St" },
    { brandName: "Michael Kors", name: "Michael Kors Ne" },
];
function normalizeForMatch(s) {
    return (s || "").toLowerCase().trim().replace(/\s+/g, " ");
}
function isAlreadyHave(brand, model) {
    const b = normalizeForMatch(brand);
    const m = normalizeForMatch(model);
    for (const { brandName: ab, name: an } of ALREADY_HAVE_ITEMS) {
        if (normalizeForMatch(ab) !== b)
            continue;
        // Match if model equals short name or model starts with / contains the short name
        const anNorm = normalizeForMatch(an);
        if (m === anNorm || m.startsWith(anNorm) || m.includes(anNorm))
            return true;
        // Also match if CSV "Bag" style: "District PM Dam-Louis Vuitton-2016" -> short name "District PM Dam"
        if (anNorm.length >= 3 && m.includes(anNorm))
            return true;
    }
    return false;
}
/** Parse a single CSV line handling quoted fields (no comma-split inside quotes). */
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
/** Load and parse CSV; map to itemsData shape; exclude already-have. */
function loadItemsFromCsv() {
    if (!fs_1.default.existsSync(CSV_PATH)) {
        console.warn(`CSV not found at ${CSV_PATH}; falling back to hardcoded itemsData only.`);
        return [];
    }
    const raw = fs_1.default.readFileSync(CSV_PATH, "utf-8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2)
        return [];
    const header = parseCsvLine(lines[0]);
    const col = (row, name) => {
        const i = header.indexOf(name);
        return i >= 0 ? (row[i] || "").trim() : "";
    };
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        const row = {};
        header.forEach((h, j) => {
            var _a;
            row[h] = (_a = cells[j]) !== null && _a !== void 0 ? _a : "";
        });
        rows.push(row);
    }
    // CSV columns: Bag, Brand, Model, Year, Photo, Receipt Photo, prelaunch sellers, Price Estimator, Quote, Approved, Approved Next Drop, sale record, Auth Needed, Cleaning needed, Income, Listing Price, prelaunch sales, photographed
    const mapped = rows
        .map((r) => ({
        bag: r["Bag"] || r["bag"] || "",
        brandName: (r["Brand"] || r["brand"] || "").trim(),
        model: (r["Model"] || r["model"] || "").trim(),
        year: (r["Year"] || r["year"] || "").trim(),
        photo: (r["Photo"] || r["photo"] || "").trim(),
        receiptPhoto: (r["Receipt Photo"] || r["receiptPhoto"] || "").trim(),
        seller: (r["prelaunch sellers"] || r["seller"] || "").trim(),
        priceEstimator: (r["Price Estimator"] ||
            r["priceEstimator"] ||
            "").trim(),
        quote: (r["Quote"] || r["quote"] || "").trim(),
        approved: (r["Approved"] || r["approved"] || "").trim(),
        approvedNextDrop: (r["Approved Next Drop"] ||
            r["approvedNextDrop"] ||
            "").trim(),
        authNeeded: (r["Auth Needed"] || r["authNeeded"] || "").trim(),
        cleaningNeeded: (r["Cleaning needed"] ||
            r["cleaningNeeded"] ||
            "").trim(),
        listingPrice: (r["Listing Price"] || r["listingPrice"] || "").trim(),
        photographed: (r["photographed"] || "").trim(),
    }))
        .filter((item) => {
        if (!item.brandName && !item.model)
            return false;
        const skip = isAlreadyHave(item.brandName, item.model) ||
            isAlreadyHave(item.brandName, item.bag);
        if (skip)
            console.log(`[Skip already have] ${item.brandName} – ${item.model || item.bag}`);
        return !skip;
    });
    return mapped;
}
// Extract URL from field like "filename (https://url)" or just "https://url"
function extractUrl(field) {
    if (!field || field.trim() === "")
        return [];
    const urls = [];
    // Match URLs in parentheses: "text (https://url)"
    const urlPattern = /\(https?:\/\/[^\)]+\)/g;
    const matches = field.match(urlPattern);
    if (matches) {
        matches.forEach((match) => {
            // Remove parentheses and extract URL
            const url = match.replace(/[()]/g, "");
            urls.push(url);
        });
    }
    else {
        // Check if the whole field is a URL
        if (field.trim().startsWith("http://") ||
            field.trim().startsWith("https://")) {
            urls.push(field.trim());
        }
    }
    return urls;
}
// Parse multiple URLs from comma-separated or newline-separated values
function parseUrls(field) {
    if (!field || field.trim() === "")
        return [];
    const urls = [];
    // Split by comma or newline
    const parts = field.split(/[,\n]/);
    parts.forEach((part) => {
        const extracted = extractUrl(part.trim());
        urls.push(...extracted);
    });
    return urls;
}
// Normalize boolean values
function normalizeBoolean(value) {
    if (!value)
        return false;
    const normalized = value.trim().toLowerCase();
    return (normalized === "checked" ||
        normalized === "true" ||
        normalized === "yes" ||
        normalized === "1");
}
// Parse listing price (remove "KWD" prefix if present)
function parseListingPrice(price) {
    if (!price || price.trim() === "")
        return "0";
    return price
        .replace(/^KWD\s*/i, "")
        .replace(/,/g, "")
        .trim();
}
// Parse year
function parseYear(year) {
    if (!year || year.trim() === "")
        return undefined;
    return year.trim();
}
// Seller name to email mapping (from previous import)
const sellerMap = {
    "Huda Ali": "hudaalifouad@gmail.com",
    "Faisal Al-Abdulhadi": "faisal.alabdulhadi1@gmail.com",
    "Janna Almuqaisib": "jannakalmuqaisib@gmail.com",
    "Hanadi Alhindi": "fatmaboodai06@gmail.com",
    "عهود جابر حمد المري": "ohoudalmarri10@icloud.com",
    "Tahreer al fadhli": "tahreeralf@gmail.com",
    "Nouf alshayji": "noufalshayjii@hotmail.com",
    "Nouf al subaie": "alsubaie.noufa@gmail.com",
    Mariam: "Mraiam@gmail.com",
    "Mariam ": "Mraiam@gmail.com",
    "Faisal Almutery": "faisal99669966@gmail.com",
    "amna_72@icloud.com": "amnahidr6@gmail.com",
    Zahra: "",
    "Zahra ": "",
};
// Items data (parsed from CSV)
const itemsData = [
    {
        bag: "LOVE Moschino S-LOVE Moschino-",
        brandName: "Louis Vuitton",
        model: "Speedy Soft 30",
        year: "2020",
        photo: "b518f8fd-e874-44c0-852d-44f1886f6bee.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/XNn_wXelEmnuaz2mzSgdkw/upELKtUDXZmCtmqaZwwBkwQb4UYTrgekcP50do6zEBG0WUl4yJltbB_7GYOf-hjCILPvoBMtnclif-Hpph27T5yrIelzBTkI2zUuvX8y4ugNWp2OE7M0XOyfTQy25-oJZSTXhE6njM_-yaf0oIC0c23LQcWXfxKXEHAiOvJOlMoCymFXeUzzA1A3R688aPdM/r54zS11vwmY0nfFr21kEsPRLJb8pSWdHla7emj-ipDc)",
        receiptPhoto: "",
        seller: "Hanadi Alhindi",
        priceEstimator: "088a2108-bf89-4097-bc73-e603ea3a5a52.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/LM6oGrl4RwuLnqkWZRdCqA/CHH649BOy1jlZYeG_j1WiFTBoeWMyKypLvsMcykZwIHL5_ca_0U4Iv2xbj2Emaafio6F_a8wgfjFPWhjNBQeUlPIFmVh3EBd1OR7eXuSdmCZJ5CaXj9k13u9pJBsSh1l2usQFrMAQJu887ejpbuHP1ibFeZRBs-ZQlMjY8NRglQJyufFvgIiu-Bg1bSda-vO/B84tZ6v-LFX4DLF6EO3ygzZfu0qgEKvRnlCza1yjuTM)",
        quote: "Hanadi Alhindi QT-000010.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/81iph5wZdXTQUZ9qRekk7Q/B5K6ujHqa47jtzlsG-7AJhIsNmmkqynCdtVG6TNVDSb95B41a5-Ge0xcvJ9_qvlmCq4_BuqGqH0gJi-Uo8VEW4B6XQr6A9FzBBcymmQq5dd_k1MRDo9EBqja29nRTxGIlr4DZxcKRsnMWC3DZzVL4IO6eUB68z3W6mxx5V-TnHwCw6UlN25sCF4YUO7sA5er/fd1Gn2LbPFuhO7tQRbF8ogMV_E60oJN3vMCWX4HZ8no)",
        approved: "checked",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "checked",
        listingPrice: "KWD400.00",
        photographed: "checked",
    },
    {
        bag: "Emilie Wallet-Louis Vuitton-2020",
        brandName: "Louis Vuitton",
        model: "Emilie Wallet",
        year: "2020",
        photo: "37f5dcb6-a423-4f1a-8c2c-4ed05fe2db3a.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/3roE2fR734pKT-JtBPlpLA/5ctzvvVgJ8ou-H6LHOTZAN9_Hzn1rTXe4CQN8MiCQr6MyevQMU6eU4gcjgvcesHezz5cA-ci4fP38vTHxOZycZK9P8dTHL1t8WuhubdzYnfYS3qdkZy0jqamwJYesfDdI16QOPpeOrvSyg5gAYjx84UXuq7wcQqXAwq83rI-UJDCa-BsPyeyJznTjiV0IYi1/EpCTmvAi7_R85_mRw3ghUfR7lSDa23eo_9xPT0R11_Y)",
        receiptPhoto: "",
        seller: "Hanadi Alhindi",
        priceEstimator: "4f4740e2-bc55-4289-8122-052d966a6642.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/Dbijt4RjHB1zvXLoopS_jg/gp7GTVtZBX5Xy5eluAhMgqDIaQvqDtPHepzvRhNTvGPj_TpX5FoPoZV6wgoA5o16VPQKok-ccxtgt0Rq_xEX0UJTlqygQVthnrybTkov_Keyq3rQszf_2bCHdjffLYZVfTJrdFCEGRfLszLsLG93hgC70xXtLGazIxzeLyOZD4dipq2T63Wc6tyzoDMKFIQq/9_gDuqSUM5sFR3QYYBSTY-QPa45-Q8hxKHlshy2L_cE)",
        quote: "Hanadi Alhindi QT-000011.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/_JnjCmMePMlZ6ZJ6wjgGRA/42gKN7VOjfe-iX1Z6PZA7upPevyMulDGXTNeLMD1cb1o0HdyXrA0LBMMDMc58mOUh-Dvw11UbrvMCdevgGf45408qdtSv07zSfIldn-f3hwWxFPv7aQ8CQBIPPKD9s62ituKkchgJFTUN-zrY4ExmDjIMGph8dgDY8rLmYjmyK0A9luBTYuE_nIQLcQeKetY/d4JRMAWfrTjQVqr7EbBsgSqCkAzNtDk79BPZcfLQZao)",
        approved: "checked",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD180.00",
        photographed: "checked",
    },
    {
        bag: "District PM Dam-Louis Vuitton-2016",
        brandName: "Louis Vuitton",
        model: "District PM Damier Graphite",
        year: "2016",
        photo: "fc8ad078-d0a1-4927-a727-3a2dd95ee61a.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/w9cNcQbn13AcYVHQVwymgA/tJzOIucz2d6ftfaZ_V9cVYW2Tdq5mtpQVWC2QPUXHUIB0x-MNqylFto4GfOHvDM0eJLyu64C4DHjeqBsvW2CAW1El8C_T1ckhg8UZrYM3G1_K87vQiIuQFbA0FRbtm-57EdZMgfUyDXZ21CC6sKKlT-D_g3yysO_6gdGYOK5H-cyShnbdtlr1NnA26EGjaz3/INvhXrXkYObh4NteZ0jMmSH9Pkb2DMQPkxReGV9epy8),0db9fa87-0cfa-4783-95df-8764baa8d620.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/xiOMXugQecLu4KrKi_PnKQ/BH8mf-7uTXpDBmWMKba2kPc_FfQW2DAyfeZG-pcvaPgTxPGO2CnH4TLzEymqhKNzLL4HIi517V8vWitydbbo_i4gtnbpRBvLR42qyv-hdqGU7lftPjYIKJgaH3TJsxlDDcQCcROsYIGkSyM_x4xCvIGEuUwsssxTeWln4LuXth40rSmuQnQ5wdWDkxtN87xC/3oMB0FtoqOJ9M8rwmF6WL6lablTJFYwplEj9is1ZQxs),de2c58b0-b7a0-4d9e-ac4b-01af1e6436fc.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/GLQ3DxFRgoEG_83OsnmaBA/oiAQXEujTPvrR-iXTxzptojXB7t0azkJdTBMb5rlXL8vEc5VusV3BHKTbxkypF5dUQA2MWrqcK1u1elcyi7ROurA9rk8DfuWi8lRhj6vsG9dV3wTiWX90m8OrdrSuNDVp0nF59_SPZ9TfxFKtVbkpvnS7jxO74KC0alDr84xbI1XidH13lXjNpikA3Fbe-eM/qm9jmsXpBrJCDXg42F2jgYbT90iSLWp_ZqBw_LNRa_0)",
        receiptPhoto: "1e2525d3-e106-4331-ba9b-2fcb52b93628.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/bAoT5n7dW0FbX5_TroMbyA/JqbNs8ilXtMjh4pEP0jHVuBG7SHI5nxDBb1sVeKcA7_EzIGsWrFcvYPSijFmxHBbluocYSh3eWN-63XR_jhmQT7tpUOV6KklzP5pw6bkJ4Ly00kh-ckEYUhXAlWFLEAhTUsklVoNcGyTAhXPukQnGYPJd5qBYMz_BpEnnYkMsAjJqHZozGgoj4BPiTW-AAE3/fJEEfqOYgqcobn1LxZy-e3MFsGpuHWk1zC4F_8LpM0k)",
        seller: "Faisal Al-Abdulhadi",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/Ee8H_Q7Di1CJb3wo3KAHVQ/bDIaTcyCrVwN3A3QhrjFR8FazBPAaeC4EO8eei1KlJOu-JiE9WiyBuGqFHdqlErukrg95M4VAn7AJd41q57zwjYbj77JCfzprztXZ7_H7V5ARAOxUA28kqANc0dWOxiRs2wvz8QrNzRTnW9NWJYtOg/3c6dNMgdDfyw3gobZHZYdYb0tlJgJcgFcTXLzCMTRRA)",
        quote: "Faisal Al-Abdulhadi QT-000004.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/kyBt-Il5rLIGii2Xy-m0JA/uraXPHzFrT4goV6CAAyBIWQjXDSKG4e5B9mPRUfMhnldnAd9jIoGg_G1IGyi02W5-Nd_7TV18KsG93oUF0XXBR3rFgT-ALvDjw0pBnxii9GYQw2EKSz82jLd_JQUFYlPG0Hc9uim9Lc4jan-42BzNQIFfHnDTQQrHJvkfxpdssgHOWoj5jV3pPH5A8laHf8G/JOuNsPILGr0xzYHYD2rjS288VbPCswSbFnKRDK4OPdU)",
        approved: "checked",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD284.00",
        photographed: "checked",
    },
    {
        bag: "Men's Clutch-Pedro-",
        brandName: "Pedro",
        model: "Men's Clutch",
        year: "",
        photo: "2bab3e67-0f03-4f73-a25c-71c2c0aa0a76.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/tlnsbuvTrwz8gAmoRAICIg/CpScdX1zmoZs2LYykVEdegnx14h-gPe6xNiOrDEAZi-CpIDbqELJxOQDRMYpD5XKznKq2TZctfjDUAfTJgFspTyMnWXTSZvEYh9oUeVVrwUuO2jBo3WqNsmDphTqMJy4qXKnsTXBn0AzVmB9aBl7464pbgeebU9b3J6aS7fnDrTJ2jl49VwV0FNaJAN8f2yo/ygCzRBn2k25pC7Q4bNucy-hS19ALk4NFfbQJqmZFsG0),019db9c0-a1bd-4200-bf7e-9d73d8af834f.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/-947XrZM1nKvIy5NJeZXSw/JtK3Zuv6twY7Ahaay7HPeHvUIE2ufXHXdYElcfjjuH19W77oso7n4Zr4J1zXuMJN4jrDte3zIOmOmHPKjLxUDHA_GyAZ0MJhzzixOBfqIbYAs7y6qdtMaRUThdpNVz-0CtJuo7lkB1K296MU_L6dqQUW0eu73dz7E0ksBeLNKc_XjnGsWh1ILkx5vNBKbyw8/XQOvgYxDmsLUoKb_UQvbMeKJA6faP_k2mv5FKiF_glI)",
        receiptPhoto: "",
        seller: "Faisal Al-Abdulhadi",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/_arPxv33vX2mJZW_rhrBqA/rv5BfeVuxLlsHt9QkRg_3qRvhXrHhW5C-JkEOuRqn0SyoY3c4dKRYlEfS0iqQCv1Qd-jEws0LMAw4xu73gQ5ba4NaN84x8CPh1PC0dbGw3tZGK7SQf1o8-c__svRgzbWNCWC3Ca55CUDRZtssthfew/z_pNI5jU5VXL1gfAwD-7HMP8FBIPnvi5uYYGD4eRzzw)",
        quote: "Faisal Al-Abdulhadi QT-000005.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/6izOSIoMchAoES1W6exuHA/nwXP0XSuaMcZ78MqlzNA0ExnwTrQmNqlUgiA47Bk1jFKJVhxowJTxkxSyYt6Kz9klOWibwUxrObQqAn0wDK4y3z9aRMumHixqZKr_1oAXnHLSavnAvNUEBJSRti8_XRKCIt48yQd3Vv84mqo-ccCW54jKll8U4BhHHBuLaDyiiGPKoTwH3jRDzGIX6RvxOK1/GMXawqKZpWrDHJbOlhAmQNTwceltYwR1CPwVJjKynPM)",
        approved: "checked",
        approvedNextDrop: "2",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD26.00",
        photographed: "checked",
    },
    {
        bag: "Beauty Case Bug-Fendi-2016",
        brandName: "Fendi",
        model: "Beauty Case Bugs Calf Leather",
        year: "2016",
        photo: "2177dc07-7f76-4817-a178-4682d7730f9d.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/VNk2fPd_Uz5V1Hi0hUyakA/qgNUAAIJZjY7Weia8OCfibCRTBRtTs8Nyxl-uRjWqv7G5W7faYOKTZ7nXaUwS18OHXa-7wN9RE4h7YLU45GFiNAoy3ZqFaXc7UEjuBZ9NB9jSTljPci_er2cIEpcY4S-rupUKmmlI-G3C4N2r2kTfdjHfmy9R5ZFzdMH63UxSVZU4JKqQqzsbUgv5Zgbk3aB/by9_rWi8ZQIHnd9k1ehkecOX8WhqxS1s30a9u-C2M1U),c9db3c3a-beee-48cd-9f85-dcf86bef9c6c.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/X5OKRoz-KvbTuPS120MaHg/_PZzl1oD-UhMgm3bvFI8SOzTMgjHqbD_Rz-HeIBfjypQcWr0HB2BRErEVRFEOlwfv4wwRtVJd61QB31p-N4JrDN27K8lfXLcwFneIJQcDyO9yfWSwmjDlPK0hoXOCCXWg8jZWZ9S9dNHA-TWHJj2XS1fUJxrCROyLQ_RVAZ6aUCqks1_tPM-VwLO8SU3rF7J/YhbDHRmH3cdq3Tqw0by6wO31MEZTYF-jFPSqpDRGR60)",
        receiptPhoto: "",
        seller: "Faisal Al-Abdulhadi",
        priceEstimator: "24862c80-66fa-4e09-a722-15e45f302d9e.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/-paqZsUe-T2yu3RJ8HdhKA/BryPBTiWMmkdQ_sBlklgoON9-u52fFTX8BnkYiN7689tdv4whkW7B5LOWLXZWpwYYujc_D7Bw4BviN4VOSPWvDbUB_rk-0esxeh0NPd0arXPmE2zDAl6hayX3d1dsjayRai5LUjFoWptbDUt-qmjHTG7pLuKUhIAtwHQ1MC2GXLgnIz3u6C6jBzQACW3QLbH/__Uu4RdIF7pbbCtd0_N0OGHI1_Ki0QPNzTwoAWFfgK4)",
        quote: "Faisal Al-Abdulhadi QT-000006.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/-taVotSrxkvNdARXwYKSJA/VTLcfOAxqM0tdsFG4vsbXgyLXdOvYrpkdCo-Yn9KThz-PfiEUYUK7UkFu_T6zclwhaEAjXdZBFWwQ0QzpZCwHbOdWmgpqW8v0mQ017mshAv41r9gR-tMrUTh9UfLSmG2J8QZcIENRqfTWPT4Ja_K33gD5YPP0SWT2GgCXZ0rNO1-lQ8PiB4NjFsaelZAfVo3/dMbcTgaVNDLLmionbURnkddeLE4Zwra_J4o1fD56AtI)",
        approved: "checked",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD120.00",
        photographed: "checked",
    },
    {
        bag: "Men's Toiletry -Louis Vuitton-2021",
        brandName: "Louis Vuitton",
        model: "Men's Toiletry Bag",
        year: "2021",
        photo: "b1e6ff65-497d-4867-8299-a3eb35c64999.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/8eCgBj6gUxhWGhJZbfyOXQ/Nv1-AsWwxDCdzkIVwPS2SYVU8nlodLLAcbXxhdoIq4xiZ6fHfN2gcK_YjSvIsOobfwo9P4G7jqJINo9jYmD3WaMXbtvWFOYMu0e6j_HYx31m7L3wpwx9T-ZFTm_kNP2sGOOIV5Xa1ElYf2-7d0I9TD6AZaE7sEn0Fzkq0nFogSPCqFd8Q3RDxCcVeRw7TvBs/RbMCrEJjmBxguBLF8R8Fc7DEvhVvCpfM2rMBaesm-QQ),3b524d0d-6dc4-440e-8170-e59f1812699e.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/mU2Vh5IAKsIvb1N6BdumTg/7ODr7G8GTAGK5G3O6xn8qcunaNuDRAGbWhUolmPKaJ1avZMCXXnO2Gm9W0FUpNfeolWrcuCy52AxxYSNb5g6_85BvS5yT1VJBA_CkEsALhRlb_41VzL9Bcp_-t7N-104SJANGMfHofbHjs6ZefcnwsQGfmmteki-jU6kbIHl_VrgTFq6Nagfr2pXao7uU_e4/x6XGY54uzT71BBYzX7M7nzhaorFQSeYxFD111dLD0tA),1df19bd4-a096-48c8-a73c-240d49288a13.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/i4_llTweBB_8gyObR_eDZA/BLhJOMKnT5Dcc3X71ZsKjXfXlnkiqdmS2bGiEFCXq-slaSlffkrozJv5J24CelzyzY5wchCgTez9LxTCI5vLd-iEYTKNLrFN6HWgOQN-dj6V07Opbk8W91aO4IyspLYogySpp7jLFl3Ut_P5iR-ZPWmbPfqyauPTccywUu2LEsByLJzfndkggifrgaAWwy1q/pWIQ1jwxQJwzy-kiOUehe9ni_gpeG0JAwPZoTUIG4rY),554a9c3c-1e31-4571-bc0a-ff6dd2b9c6cc.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/QHMHVOSpnBiIyiwIW9Dehw/cGFVqLQR_LgP2NR2tCr4L8qMygkF0Zc796jbZN5dmKij-pbeahfQ9oGCCrNKljeNSLDVS3i6I3ytrnMGwpSVWehq9i3l_qDXJ1HnOEZtF7eAQkMueY72ykimgAvuaq1oFPyPtbXcDosuvgwYItTIwy6l4X6XTTDmDRVAaT68Q9BPBql8N0eVeUT23-QJt2Fo/IA0-FPNrqsHM26X3ZYCqmzrd1Ut8BktoKrUX9KpIBvQ)",
        receiptPhoto: "",
        seller: "Faisal Al-Abdulhadi",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/by8CiMdZcmhrQzUu6l8w3g/MkiOIrJ7MlZKyADqmHSJHJZ6YpM1z-BCN3KsfF2lb3Y175Z30kP0NbaQmlN-Ly8WNEDSeSLPBPtF6L1Z-PUe9dkBxtVxKlI5u7yRx8pW02MOgjvL4YLLgw7_rnefZ-AZJaUb-b9LPtxMe3dcyIvBtQ/qFL0h5Xr5Cb_do6wIJTagEbpKxuJ4vmy58ma4CCn-1k)",
        quote: "Faisal Al-Abdulhadi QT-000007.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/Hv4qNBrORHq-At00Ajm8QQ/QIhl-WF9U95Nsy5Y5hlltEHeWxWtsa9lqFyvVHrsozIfhZuW7u9bNWJ58ZglOlk2GjVQTl9l5rZPABKMaCEO2dLudOpuQobVFdzEqU2cOuMxvK2R5XIrQMWVdhdNcUyrnQCuOv7zjwgKxYy-sWk4UZhIoGMbpFDlyY1_OqVwRpvNSjWu_Zm_anrPFLx69hWR/CI6bb4cnfD0Xbao6oCfHesISzP2Ikcf6hDjjjWPjB0M)",
        approved: "checked",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD200.00",
        photographed: "checked",
    },
    {
        bag: "Men's Backpack-Kenzo-2020",
        brandName: "Kenzo",
        model: "Men's Backpack",
        year: "2020",
        photo: "542c8ee8-c688-4d9c-a37f-d6861cf77e75.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/Ht03_imnYRhvLWCulzFeWg/fWDOkbCp_pOzjzVdH2nzrDqz5BU5M0rAJpRE3uElZY4d3h5xOBa8eoRRkJ-nx-e4k4e3zXREUTuLeMJVWuG0Un1MvEYDCaKNEw4xOWBz6zwc94Il68HanJ9k2hmTNaJNTDB8CChLSEawZGNv8xApOKXuzXW80vIljxSXPvKxwiP20KBvRXQNfpYbhV8E2s77/5XqROy5XuP3-JZIozzoIm12LPDUKlftO8au8NW_5D2E),d1cace82-4133-42a0-b7bb-5f3419904ea4.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/tR4OuyxrFD6moLiVDh_fQg/LQeOk0tSZ9YqPFaAe9BAKua2h81dp1VmqCKdxb9qbg6OUddjYytQp-yQlNgree_Fyo3M8jnpdyh9jWM9HGtCDISBNmN3ObVd5d5BMUwHjVijzxFWRQ7FDm694Kdb_OI7LsBughUtaVPj4wcZgHitkl62IlzAN0kxMsbUufP6rESltMYaQ86k3Awc59wYPT1M/BvCt0gnYfItxDIw4uwwYGDIxgGDsHVKZnMpnmiFN7c0)",
        receiptPhoto: "",
        seller: "Faisal Al-Abdulhadi",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/r2U74xkMfdkkF2bMP3lQMg/iTMiPDmhkcR154JIIWtYtajVI-PoA3OVuSvnhp04fDGTbB9LXWNYVq9An-FRKUX1MrDqQmTxn44hrhEltqr9OR_GMwrO2Mw60uKRFwDxkvBgdOT1-WaJA2VGZhQaP2mrPLoIobt-q_45NLN3VOq8RQ/WLXuVhmxpG4AO-rSb-_zruaX2QDU85DUgQTrIUWsryU)",
        quote: "Faisal Al-Abdulhadi QT-000008.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/TWAo8MqVzRoeoC5pkc61nw/LAORbagsFILgIjFtuimMbpa-wsDAuimPxH-ONdj-_Ef4fZmeNvwN1sK5GDHUeJlRKsWD_KBGHXYIe_X19YYA_bp9gJl00MEPDP428nhI9xyHDr-ccznYFR-G2_gQqOH1r2QBMXOiUGoEz8ghJ3kfFkXlBMh1mQ4qutLXnyGb7x3ezLsJt65d_JyhL4Mfmq5g/EJPiUJQyMhKmaNotexdBRzwWCuUwubHyby8XEmv-vE0)",
        approved: "checked",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD48.00",
        photographed: "checked",
    },
    {
        bag: "Fendi Red Leath-Fendi-2013",
        brandName: "Fendi",
        model: "Fendi Red Leather 2Jours Tote",
        year: "2013",
        photo: "6dae3afb-5a20-46ca-8f86-a57f211e025d.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/MAojzWyrPm6lr2FiTCfiYA/moU5dzOVSEbO3y-svxVsUJxS5lbr2UN3Y7OmK2uJC-pFvdiaRELvEt9-hURZkOTJrfyDtPXNDd5BFnFZhnIcuyvPPXlmz2hdTME_G1OPmsuRhpe1t42U8nqNbrGQkHgc7CMsgeTvfBVdSZ4YUoXZlTwZEtRBi4jmDDCJHYbP1-ZZ6eQ1AJEvB4LEbvIXOBG4/KncLaQTiqifnffOSEplVT19h0nNzt7q9tagVX09yIzo),823ea510-e81f-4139-a70e-4d3b2279ee82.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/e1hgfiZLlaMZFfvxFmGo8g/rhd1ukpGA7llM1uvhrDe1T-BvgSFLPdUcGxH1ZD6d8fZDdwppz3Y6s7tBsF0jmnRaHQNquoqmMrd__Nd2pdgwJVTAWWZqOS2-yWpTzB-WWWaLRCNKvoP2FNqnchmtq_90ZSk4ech_M1kUaHmnRxBY_Q_L8fW_hIhLXsmf3JGADVRfZEEc6Q-y40Ujj-byZiQ/iiDR8Y8b6_pa8wYf0nVnU5Wj7942kLZ3xDPktOQI4aw),8a1f7265-68c7-43f4-bd30-79ae47bca66c.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/jWlJOs5jj1FKVnzB7JU6MQ/E7sJQUtyRR-dyFUnWhl5jE0Bd7OR0HoyNWwwP2Zm751G3OQiJ8ryHGCkqJV7f217e39K1DBrzP_vHJAGJe4Wo3z4yqMBYCIGBt3JhR34kszKpu5eSgGA3YUYaM9j_2QVx-_Mt2UfPU2hEFVHBAoDqjynPx8twvV5T9wI5IaVFSvdZ7LkEJAxM6TqFFjI4L2k/NPkSLeqeJIeDv6-TJZYTGUnY1qjguCtjX9UenerffGI)",
        receiptPhoto: "",
        seller: "عهود جابر حمد المري",
        priceEstimator: "376ad11b-1230-431a-b052-0498e859706d.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/ndjYMEiMypDIuSilFcaESw/7lTntZftBULtm34GH8jB_s5QHjE31moGrIE2C8m61rUrYy3KkTzP_ZXQlYKCMVCj8MdRP3VfluEk8eNKawI0Dd7kqHzqPE3DXRVyE0YWWLxgiO1BsvkXHeZnw7QTEliN9Vn6-8iKI9gCzuZvfQaFiW84jvfXpV3Jzia5-IPuXc0jprM7P24aP0YlFQdZe7X7/JrIB6DQ1HdIPtOaKNTHnsdel5iOmICbzAiPT3ahfhN4)",
        quote: "عهود المري QT-000012.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/C5aiQEjOCe-k7AZY3nCrkA/R9vXMB3FsDaveOqfcTLxG9LlDeVTRmfD7-U48HqFgf_udILtZcPtj5iOjP62aVuA_9R5VmJfmDKydsBKM86Llkqdwx6pmejw-5birFAX__GjZ8qcCv4WT8s3WIsFJTtHUcfWOUW_riSW3vA6T6NGh7CzSStC97UCb60NCLt2Io0/tw9QLCaxVmQRRAdnvuZopAIN2Q82ZNlRArEhVCk2vFc)",
        approved: "checked",
        approvedNextDrop: "",
        authNeeded: "checked",
        cleaningNeeded: "",
        listingPrice: "KWD350.00",
        photographed: "checked",
    },
    {
        bag: "Antigona bag in-Givenchy-2014",
        brandName: "Givenchy",
        model: "Antigona bag in crocodile effect leather",
        year: "2014",
        photo: "6df45087-02e6-4261-b3b3-c6fd7feca762.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/aWWNudBLgVvNUd9IOysKKA/Uga6f-qIiNZDKb8zMaXIjbRybBE__Z9r2hGl2w35tuipgSZBybP0UswBvekncmjKb1QhRXBg81x5cbAtOcyC8P10-Aaol9eezTWFyS9lotItCjbpX8jOSwsPtFrWXSvEofKSY4dnCHSzc8jOlXcMlMK4ufPZncrARC5CHXATtVWVN_4toaBgTUoLs4GcZazp/YzJ1fPc537LJqU1JnUS_iE84MWTulN5TbYzSaPHOPJQ),ce5872b2-9641-4574-944d-005bf049243b.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/1c7Y24X6jVX1TXO4CcJmbw/Pwe2iIgY9TMrKuarGEIJT62XegUAbDjg3V1oMjvO5J5pcj7O_5aZt7rAzBOxUcqu57_7VeTNqyAvkFAcHlhX3fkIGnyyOF7XzT0fimxo-_CoO2rj4GOrNYDc5SpXiipLBHkEmVA8lgXeLHdg8I6Fezd-ovh0v0etgCk70hFNlIJ7JJLkbQZsXqfAL7hg31qJ/g1MKzk74976quF8BYDGydcq1q3JLd4RM8UA4qFh_MJo)",
        receiptPhoto: "",
        seller: "عهود جابر حمد المري",
        priceEstimator: "5865c374-a7f7-41f1-9707-c5167bd22918.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/VmFnTowJTkwf1cJ7mZbStA/6B-pbfo8gO6GrN0ZtiXz_hHvarISLQio4Gl64pYyN6HH2Wpl0nI11p_kI0MqVK8ni6dNx2eXHQm-qaF-ZYAm61Rvx7SBOyvvfwsIFLVQ_2_tWpGL-_V20tasIwSgHZhnlngMlVzU22qLckeXnl4zUYm4UhwCLk0vQ5BBr2zyvpY1Oe8XNZmHVRHOmhFdTfCn/_wpGkkGF06WtXb-lCo0Na6UZS_-eURc9PppUBsjyN8M)",
        quote: "عهود المري QT-000013.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/zROsE5lPXL78mAuC2EPo7g/xinOnr7I8vAGfluu2W-kN6a7BTEJ35NemRmUxTxFHQuMgcT0rAoSxMW6qHKW7U4yAk3HWf1HSVbRWx-N87CekUGf0qcAEDFXz_rd7UBW1e4lI893bj5bT5yRMQ2lLKGjeUSlkyIl0bAmiqmIbCMKGJtlQhHw7DbncBjJikAkHLU/yxjZ3nghvoUfa0xqQ6EoFYNME8BZ_1GUk_i_VdTAAHY)",
        approved: "checked",
        approvedNextDrop: "",
        authNeeded: "checked",
        cleaningNeeded: "",
        listingPrice: "KWD430.00",
        photographed: "checked",
    },
    {
        bag: "SAC DE JOUR in -Saint Laurent (YSL)-2014",
        brandName: "Saint Laurent (YSL)",
        model: "SAC DE JOUR in grained leather - SMALL",
        year: "2014",
        photo: "e92e70fe-910f-4982-9d8e-db4c5d7a8bf9.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/Ld9jkF--MzrnqCskuMrzPw/Hb4PpF2CTptQwTs2cZgjdT57CDVA_y3k3fP-m-VLt0EeHmXHP2Qt2q0GTmMzsr6Sepm3R9vrCH4N-JcqhTEBtOQgLrHC0cvQZvL8r53ybxdFP26jWKr_nl-EPkqoNJ6-2xVwvOoGBlMBj-oIZsfPBTIZYRrBaNPbRXGuFxuC5bGN3JXuTa3Y8HyrIbZ8r64S/qqvkn77x-LKJbGNZYogyX9DLLw31fTieU2AcEptF_Dg)",
        receiptPhoto: "",
        seller: "Tahreer al fadhli",
        priceEstimator: "ce6420a4-5bc8-49e8-a703-3914a6a7a887.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/i7ejPJxnJ3MbytnDRbxGnQ/nBbZbNdY3mhBxbXI74qvkTpObraOPHmIo8Z_z3YxUeK_jD7vJm1gxVd2hSTG7xdhPn40jEpWmF7IZK5FIswbSR-ZdnJIUUAUGqKM6bkJAvrBiVX4y57_e-4PtDT4874z32kd16rH2y16wnxZx7xyKGJdpas24pxDlW6EoVbvgXMNivKcweRpQhG08OZftaqL/agLVPLlXHGBeNiCRq0CS_XhDJAgtJVpIAcZBmZRqNm0)",
        quote: "Tahreer al fadhli QT-000014.pdf (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/SEE-BRXCC3y6O_UnXKxPGA/Zs61fdYIU1OQImcPC2A-Di4d_MC3u6RFoCHikBHS0mnw0x_OuKdLawNAoxvT5Sn8udM6Z7mb2PO7VK5omsB1vZVswhQCgXpGIfN4KTVGMILn7KXwjnojQaMns6qDNtlWPhAfzzFraa2pwj5FWtt9F2LqOBxisOzNWXDPMc1ckIbr40ux8W1NO0WGzDhe4tht/fZkJfhymEs_Fm25kCdlarbAuT6AvSoWk-UmYaraPO5Y)",
        approved: "checked",
        approvedNextDrop: "",
        authNeeded: "checked",
        cleaningNeeded: "",
        listingPrice: "KWD550.00",
        photographed: "checked",
    },
    {
        bag: "Knitted bag-Vasilis & Roxani-",
        brandName: "Vasilis & Roxani",
        model: "Knitted bag",
        year: "",
        photo: "233ef873-21a6-4435-aae2-57e98af323d3.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/HwvwHCrmSpyf77XeQFfN5A/XJc0hsYQ-hWelBYPIIe4d_Oq2k7ct6NbprdpqJ1qd7gCqOC8F6FW48H6fqpWI7bZFt9jnjOHcTZeVyFsPY1V2NFfdbnnWutVYYbWymzNsYbovJW2r1a71Uf3cxHP13un5QPFQ01AF9PRhm6UjbPabVbQFOnb_Ea2RAh3AkFABhKnete1OcZeH0F3aTc6gSpF/OpetQ7jbzkCV-PJle-8id_PQCuUsRWVT34Bsot1WJgI)",
        receiptPhoto: "",
        seller: "Mariam ",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/2aqt9c0I8CKmfmIGfDxTNw/D56BAwEkLQBvd0vpC20cPtjGM3BL2ehJeSmUMAuYT41J6p6-ReN4wcneVi6WSBx6vch4AUbKGXSi_wTtaQsQmMbVazOITGx-tGeyzVhcGvIV9XdGblceXJ2v90w-W1AbKz5gORtr3yXHsNSUBfclDA/dQrktYr50sHRVhQ8_0fjGuRillH_H4voZfqWybn9Pks)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD80.00",
        photographed: "",
    },
    {
        bag: "Versace Black C-Versace-",
        brandName: "Versace",
        model: "Versace Black Chinchilla Madonna Boston Bag",
        year: "",
        photo: "0b7a3244-cb20-4276-b3c7-042f25ea5361.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/GCXJtCRwWvTvl9MXgppMjQ/8s477d5sVEbV9k0xzwy6qo87fGDZgKLY5O2EoTrnR_VCKM5Qq4U9ILtThDoZrCKNcKQ1qpmzUlBF37Gw4wotZpr5lNxeNhgm5CCEu9o1prDm-PBvM2CDe51teDHtguBAwYdy82rNefFEFsYlTY8WVV1doaMaQcEMGus5AyPjzNA8KIIa1Fdx7q9zdGeNG305/Jym9YOr0Hr_0Gn1mykvqwP7HkLdgfEqLCumjsP84It0)",
        receiptPhoto: "",
        seller: "Mariam ",
        priceEstimator: "verace black new.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/pza9f32G7CCB4_BvuBD95Q/mkPwjTgQQr7LGnVXFyQZ-kc1QZzAMNnA7Aab3pN8y6IVmjf3LLkdsFBBHQ0HP-AwjlbEiVt3U90AIi9-rwUWrC3qT_xHEX_W2HsuKV_iyXGBMRslv5jJGdzoXZX2Jkqf2Eu6kT6fdyE99-8waIxeKuDZLNxZQomTXUsVHlB8jQU/VjRYmZ1B6oab1s4EET96wmntl0Uwq4GOd30d8owdBbE)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD290.00",
        photographed: "",
    },
    {
        bag: "Navy Velvet Tot-Georgio Armani-",
        brandName: "Georgio Armani",
        model: "Navy Velvet Tote",
        year: "",
        photo: "c786d963-8b11-4d4d-b03b-b9ceac988dff.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/SrVUtGmAixobHtQKYSD-zw/tHsIYHVuAfBV9x6JqC9U2Etk1R9r-qrvuRm5PMw0Dz_aM9_pVPNCWbFDydBMe581lrDiZp0U8awc5Fv25-CDtpUfAU5XEFH7Kpino9W15T3gk27O4XDnESlJbAGXFRYCLOcjB0MkdprsRZHMnquN3O1J44O_NKVFcwlgjjHn1H4K9xuWjqmxXfvuiyHQNh-i/1KW9B0ruNDIyHeAOIE_kYXrz9liaH8Psdso7RPxZme8)",
        receiptPhoto: "",
        seller: "Mariam ",
        priceEstimator: "velvet armani new pricing.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/vc74ys3Vx_l_Im0vu5OHDA/-IiGzcBxnzEADBViG0LECIieF3AFu3MstBM882IGgkdLX5pA_J6Z6UjxdnK_tLscTEbkrdMQzj3qkqZ5RGDiGFcmjPOweBXEwX3QWSCyjEN4Xqdu3AIqMtPs6L8KO9r2guLfb7-K_5tE95fjZCFyaKqi-LRqjuSDbuppxMkuk3MbeMuT88IRFX4hI6HkjGzW/nJsOJlvE4e3c5g55EdaMqMZLPNSr7Pmodlh7t8UqVs8)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD125.00",
        photographed: "",
    },
    {
        bag: "Leather Trim St-Michael Kors-",
        brandName: "Michael Kors",
        model: "Leather Trim Straw Shoulder Bag",
        year: "",
        photo: "e6bc9d4f-655a-4f60-ae7c-0919f7cca7e4.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/WzGMglpDt5CMvUb0BIBNHA/cTZNTJCOYYgMsq70QndTk6fhu0Wow-_rHWnshq0ukmY9SivNSHMUYfZ1DHo75tJSICbwSuEY1VbJF_coCEoQDR71_iG_dYQBTCB3oTXjFvfg7hD8-CDzorHtjdNGqG8JLdmB1bZTqT7pRwZGif2a20OfFXKTwgV3PZmI8nbR2sFIC0wFPGujmyXWH4MyL5rM/nlNclIYolEQJHlxacUB_K-_LB-1jdYWXCdTFICL4jk4)",
        receiptPhoto: "",
        seller: "Mariam ",
        priceEstimator: "MK starw new.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/ybSemkaO7RPZckDRigt6vA/1Tn4npLkmWPV9IT8TbfawkNeaAiVUxRMQM4vclNRS1-MuFa85vXLbyYqPbTsfqkpwy79HQ4c_w1H5pyp0_Huje8zec3ZTuSHK-WaLrsFblpV1DluKm53ZkXeSkcT78Y9QJqBrbQ6-uPC-SMtF84O5smN8WZUvOY8AFOTRDVwtQM/wPrHZ7vXRPXn6ag5Y_lN2F0KEN05VlCJuJF-HWGAf2A)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD64.00",
        photographed: "",
    },
    {
        bag: "Michael Kors Ne-Michael Kors-",
        brandName: "Michael Kors",
        model: "Michael Kors Neon Yellow Leather Tote Bag Shoulder Purse",
        year: "",
        photo: "6c854fe7-c243-4c1e-9c0c-27eb925d8372.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/tvvPBgKvI9pqxRbwnWVTlA/bnw6L3-YsdeHCwXjElWbuaDoQhTEYEQOfJcZ7RZ_-3cEz8aZgMujVfZNAOwr_lhCSws7UMfK7tIpvh73Pp4dX-NCAWSjZQTApt0_mJp3N3lrpRbBFvLOcACyp2MnpmL9t63Qg_fwqsnzMuRNppctEomgvLgE-s3dkhME006Jc7lwWJZnOQaldWHYaZnMv9Ul/jnwAwsKxTauDJnjJDifiqtIs_CBxoGKzEs6JOrY-LYo)",
        receiptPhoto: "",
        seller: "",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/KP7WuCog636USlBsMCwCcg/_Xx2AUOwFA6AyC22PIpuzIWA4qjmhtwb4h_DUgewr0W61ufsV4CCq9pLAFFVdfu8pBnfxxIG4-0gU4agl8A9FvCUvP6Kfp734FzXP-7ad34BVVXrJAxXXIHKc6fYhiE6_33jKxmwmrRQ8lPgDgYOnw/A-ztixPTsXODAgbgnJTrl716Ba3Ap2AMyBzYVoRSdSA)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "",
        photographed: "",
    },
    {
        bag: "LOVE Moschino S-LOVE Moschino-",
        brandName: "LOVE Moschino",
        model: "LOVE Moschino Shopper Bag",
        year: "",
        photo: "70153528-1ede-4b64-9a66-3bd6432d3cb9.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/GTyK-K7rF54dAR2CZYkGEQ/VzpbmMKfsfDYsdFLEBX8Rf0sZr7YYDFEmzXi6f2e2u2NF3JrQHeCKV8YxIdUXzoJpUCsrNgVIVWfbu8uV2RLCqsrCb5-AyV7f_kSWTpM5qLbs46pbtUUF4iliBqUndw1-0F92J5EJeRE2Sqzenz7CS2BYKwhEvm5NXT6SLOwkjqO88aawfCYW8ObUaO5Emdk/PsbWQb_jg999Yo5Xo6AshvBAxztMNnbYAXJZTYCiZrI)",
        receiptPhoto: "",
        seller: "",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/da7opjyMcGOFHYcwZEZGcQ/lF0LpSS1gXmgZXArC3_aWAWdYSHpNc7StBnd6uRmc9lij6rGVwdDP4lCiVrllbjVdQM7LTXT70mpLhSwjdJy0fPp1Ri9R8fZS0S2r43An-5V7AA70R9yNlvCkpcGoHUxSxrcNAIfqNDKNUk4mYp3LA/r9WI_zx4P7l8Z1g7BgyuVceL0sbjwZceqU5D3tfXWQQ)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "",
        photographed: "",
    },
    {
        bag: "Lace Bag with F-Manoush-",
        brandName: "Manoush",
        model: "Lace Bag with Flowers",
        year: "",
        photo: "f3bd5311-2c46-491b-82b8-9d3fd39e8545.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/_1_4o-DXcM7lIIZ8IyDUlw/imA_k4IIpBoG9yOyZHUoMe9Tib6PXoRH0zRktDtLZayPSnnMlbFvkxCxLactWP426JaieW-SgCeOcuIcqsnPUxi-pJdLmAJM_vxJX7QSYM7L-AcTipgIHaXmpjpSUc1jAIXKmAUnPNYb9LEk_wyN_cw8RhBNOakDSkDrhOQeZ3WkjsCQ7YU7dXqQMhCHeQAL/XfF77JwN1NoQJ_dKpqdaQrEKB1fOBJxtoMimwT2fwuw)",
        receiptPhoto: "",
        seller: "",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/LLL2NBAycFsTee45TeYrEA/7NBHAhVd7ytLQJCD6-sX365bcYR-UUwVVk3w-VTJqwS3NzVSMJfIXjnBxAlklnS9HIX7WlD3AgUrad5R-CLy5eNiGjrRbWU7zBtyn-MsofZTJnT3m-VtYtZjLfs14yvyiWpb2kfZbvAITnM8HGxlLw/6mBw0gq9aTD8UusAn4mvblXYeKDJzqvnBfVPL45WHdM)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "",
        photographed: "",
    },
    {
        bag: "Laptop Bag-Burberry-",
        brandName: "Burberry",
        model: "Laptop Bag",
        year: "",
        photo: "790eada1-b08e-4a64-b2d4-cb916fc895bf.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/IwduCc0upw2SMrGTKzdEMw/nH_0PkkQu2llhiYKRXuBew4rfGMHgafUHP74mykfKyY-LDcu0kV4SwKEZNBdsI2G6KVC8y1tdnBTFmJBXXZ1ATYJ4snipDKZQBFrl3Kh2x_fjuA_646t4Syb4Vqkh4JkQOCbLkbAQ81JwW57xxR-fj2Az3hlYE1a-i6dDHSBsH8XfX9lH7K8AJiSXpmPrGkQ/AF2_isuH-2yauOD3v8a1AFANjAi4mw7wmS7I35F45Ys)",
        receiptPhoto: "",
        seller: "",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/apRaPePfY5l6jTqtWE1Pnw/KMN83JZK4rhLFLBA3X0_lQdIqKmA9tHv98P4oNFriFrppFAzZRAUq9yErZNLs4kueHURvXwYjf_BHk7bb9gRgDBnQHxK303IP-aF7r51-h9f5VG12N90zmzs_P8_68tjCLVva6Rue-tU7ei-AZOl0Q/NCSzxuIdR0asTfDWPJQqrgLoqSjiIPxSkPoIG3C0-Fw)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "",
        photographed: "",
    },
    {
        bag: "Falabella vegan-Stella Mccartney-",
        brandName: "Stella Mccartney",
        model: "Falabella vegan leather handbag",
        year: "",
        photo: "a6de2bde-4d2b-44fa-89de-b9d48be154a4 (1).jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/Cr748QhlcL0RL9RPR9lnxw/ytE4bjGGWKpZtTOc0RTJrekT8YmPxRdQazfNXXKfrUMbTZZTV3uKzn-zW1VtgNamMweurAQzznXyc_YbN2g71LAvo-GCL-gUxl_lTlQsZVO8SJzQj196CO2FqXVHqUVh95AWwNDcbFWyfCZ3B6LrDHjQNNqBxpxILJGy3DZVbfwzDe3kw-GozOCL070o4vMZGgxUtDB3ieWVT9bafcfWpQ/adFBX61aACAA3SZVJazawzEVkf7DRI4fVgNYJysa0wk)",
        receiptPhoto: "",
        seller: "Mariam ",
        priceEstimator: "purple stella new.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/u_aeg_4jKZAW-_1xSA7rJw/UnpWoHrf3Mx4NkGpLZbtikt7TeYQDGAMYZwlwmilZ2FF9h0sHwIvZrTXm1RDjBfG4WHlomm4DF_Me5rG7ZPYQD6nwjjzO7GZimqcARKow3k-M5Y6u7e0bsrzCy96z1coFhLO4WiRSs143PiiAw4M60OlFx-VYITPjKdcYXcYRvM/Zq8EKsMgVROjq9OYwl1DWEU_Rbb5Ux6cQhLAV5Rs5rs)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD300.00",
        photographed: "",
    },
    {
        bag: "Yellow suede to-Salvatore Ferragamo-",
        brandName: "Salvatore Ferragamo",
        model: "Yellow suede tote",
        year: "",
        photo: "92399987-b8d5-4aae-a08b-4a802f110552.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/7jaSQilMULMQp3QbYkunRQ/CpdFJKKJSt2ExGoH5rzrzJEvMcwmnRAicNWx2na-gBfkhMN73fvKv_w2Hi_ycKHCq0_uZsMEHC8BZCi9hTASTBswq80SE6Zgcb_aPgZOvyl-yJX6uCNLtrfNXW4zkaiYi0zrYxgGMgTYnpulA9OJ9Uapvv1bHQ2udiS0sbRcwnq481Zg3M9vJ5uqLzx43-ki/Rm260ODAAPusj6v80vzRqQptUPi9mKfaV3omn26OaTw)",
        receiptPhoto: "",
        seller: "Mariam ",
        priceEstimator: "yellow suede new.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/aOk64aoCZeKVivf2130dzg/44Lo9VdI_rdeSBPc7qpUcOHLgx8xDOw45DHutioN1wmx3Omuc__tDoA8UaHGrCGeFX6aeESmhs7oBGtue_FSOmuBfosdgbJaX615lWUl__J-Kxj4vi9sXg8Ni8pFBcfI3mC6Iq4TKvcpxjVlYeC2VW4vq3OoiE6-6hYuRr5OfLw/vFYEBZscMb8IK7PVLPEsNH55ehJN7eBrlg39N4MixL8)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD175.00",
        photographed: "",
    },
    {
        bag: "Soft Lamb Punto-Bottega Veneta-",
        brandName: "Bottega Veneta",
        model: "Soft Lamb Punto Mocassino Shoulder Bag",
        year: "",
        photo: "22f1d2fc-03e7-418d-a0f2-3b9f3c16bd36.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/oC3ggCvqRfFvF4WwdrLtjA/RqSfslkEXb2eONYWjITtzWHiZiz5V6gfjM_ATxpedHvSONu49EssrzgZHsIEbGfxl3c5_7p87sENjIrZ95CGWt0MbHGlPvh8ok5_456jmhafP_8YnL_3wPoXvW11prepBIj6ujkLqZGgkbtnKmU0y7iQleK4TX146NnHZVL_wA4MX4ZaH42gVQyYaDO_UkU4/nj8hdoqCnQdPwaEkNmfQeaxxMjw2Zz21U_XrUYOZGUc)",
        receiptPhoto: "",
        seller: "Mariam ",
        priceEstimator: "yellow bottega .png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/R342Ca_wWkjMb3J29mV_6A/-M5zxXjUz0C67Wt2ddg9EIiV6ZXP_hffKwNYsAC2KREhm8yG8LkNxf3thF9_teq3SHvIU3Az9wN7dUXhrxPW6oxcpjyDQ_eJNT45mTPdheAQhM1_zrut74L__bs-NKktHmGb7lsvoM5TOONb6NAmBKqI8gxKoffyEV9Xw_uCmfU/w8eCI5sZbcqOJpm5xuM7mJG83Sej-mhUAJGr2jAKUBQ)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD350.00",
        photographed: "",
    },
    {
        bag: "Origami zipped -Purification Garcia-",
        brandName: "Purification Garcia",
        model: "Origami zipped shoulder bag",
        year: "",
        photo: "c79000b4-ed8a-4774-bb08-df00b805e6a5.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/O2dbw-fuphr17V0sQlvqGQ/-dkcXd8k2EeZOC4_TIWCB314iKE2PxfMi-8yCImkCXWZtOfS-4mwwgNN62Maw8Z4KcG_jP3lXjyX2y5xGPj47U-tQQNard_2r2cjSoC3k6HZiGU77E4Zt-DCIR8mjsOg_1Z_8xcVZVEYX5HFAC18XMfPp046FkRwwdgf2f21-OvVJpmlh9ia835-zljQD5Ht/6mkFPdSnUcFuFWng4WxKPOtvRh4tMXygVfJHG2CLQ2A)",
        receiptPhoto: "",
        seller: "Mariam ",
        priceEstimator: "origamni new .png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/PTQG2nBDYIG0SMvWAl-KzA/QXvqJU9RQcc4b2UruPJyqFjrlDykeIIPz3EObMSLD5796FFo5BMbT3sULNw5HIu4Uo_cOnSQO6ZYQnOA34QD8_teOFVcVmH6F9YHyGycKZKcmvGAzdqmdRIDg6zzsJtPwVxgz0mjw8ZuIb8yv6umjVs1EWVD2Oq_NxW6R44tAVQ/CiNlCSeFM76dzKwDtiIK6dVV-7OF1WGOgETLA7ZxV9s)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "KWD60.00",
        photographed: "",
    },
    {
        bag: "Black Paillette-Miu Miu-",
        brandName: "Miu Miu",
        model: "Black Paillette Sequin Turnlock Top Handle Bag",
        year: "",
        photo: "e34fcad5-edb1-490a-988d-ee4ac1f99078.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/cdFdxkQR1uLnPjuSKtNTOQ/jIUOGxn0Rc31KiazTqA_XzzDdQv2mWqj6hnEmpHUQ64z7WiPIneb4KADc6c_Tn-GWX4d_n7JlbwhyVawinzdM0KhvZ6-PG0etdDMz0jhNzCbOBlisettoFOxw9X6VmvRaUiCqFGmghnkHEwOLOdGTnPrvAMrteMFz5Eu3nNYprsswBkZo_rWCWKp9C-XCfTa/aaC1WLlbxVJJo5ns-qCDtwLqYsrz2tc9Ck3N-c-5iuk)",
        receiptPhoto: "",
        seller: "",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/YO7GhYNHy3oK6TVaXBRv9g/fUIilqzMNZtItMenpUBtCsyGsk0VWpkWSy_fudtoK8VfsG14u8cXGu4s5ZTLxlLBeGcy0kl78vHL_Tby2_KU2gJtljpldveSTZg_g5sqjsXHnO_FFxRQ2Ke8RQ-UkMNHoRmdp55Xw7qnKen3Z-VAew/Xa5UdGTikhFpUe4SGM8QYv3Uf4RQffZkaymHNfSzA2Q)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "",
        photographed: "",
    },
    {
        bag: "Lace Tote Bag-Ermanno Servino-",
        brandName: "Ermanno Servino",
        model: "Lace Tote Bag",
        year: "",
        photo: "6ba14440-9601-46bf-8a54-56e21fa63c7f.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/1sosY77W2TFX5xM0UY8_DA/cAwlT6ywLKLbXuCvEpkTbkMD-_WAi0tSkR9kgCnaDYDfSLW64gvWFb4q1bBqZKjW2P-SuessKn9M0kVqyU5e29XF-yy1xlTRNxLiHXIKHfEQm3b5duaw8Ph_m6FWWeDMOl5zS9TLhEd_FDfRZtS-Yvg8n6flVxmVx_qDO-fHjATQaRY1vd_h8cY3T4Tm4T3E/w-qMbhwrtQdWUH49G-4idffxs44QS87BHxdcJBeejTE)",
        receiptPhoto: "",
        seller: "",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/xuscRvf85kja1mLiPwQcCQ/NMt5yT8aP8vSIGTVBBCIWkfddZabXZoz4IHDZ1O5fgMYv8qovE33yWPo40AuGHUqRwwytVdCU-IYunf9JikoFKUbOWzDO2oBZ-8m5OjN2bNLWlInBwn2_kepPLKKRR-4HxiBniA1LJ_hsyiqv3G3dQ/cRFi4v6hzaZpa2EG4lu9D2UyhtOSRDJC7EiOAkrPKGY)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "",
        photographed: "",
    },
    {
        bag: "Leather Top Han-Victoria Beckham-",
        brandName: "Victoria Beckham",
        model: "Leather Top Handle Bag",
        year: "",
        photo: "ac38accc-3f1c-4631-9edd-b24f52fac83d.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/vFgvIeDcIAhAGsUBQ9EZDA/38MSntLTPHA0oA7zMfhh_Jj3Ny1jAUoNMgHtCnZNB-aRx8YnHxWwhlZcrIEeKRaAB2ab9LFvr29xAu7mB93hc9moLa_mQC-nJZJYPS8cRFsWlcK3lXwLlp1e-Aj_vJIsr_5a8TzvD5Q8VaEezRlqaB6AytnZJR70dSmCIbgrvxSDrXRjTQSUdnViTDS95VXx/gjIqyLSJKTLEcFiyCtjjGqwrjurWHm3dm8vsgdM9Iok)",
        receiptPhoto: "",
        seller: "",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/_a2UWjNAXovXXmjKog8dBQ/4eOl2h-ycTt3bJ2Pf7yCYrVPLZ0wqvZcINGxdZyIk92l4HEc32xD-yLq_FaCbjeBxYf733GaCFJ3Esavs2HabaF5w98wNlVbpL1AsZf-eEgfJ9cJG-cjKvTl2luqbkko7AXz03aGwxq1LncVAXZwsg/_57T0Q14jJJq7E91Hz9WywA46JsPsIsNTxaWwYWfH3s)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "",
        photographed: "",
    },
    {
        bag: "Fourre-Tout Lea-Bottega Veneta-",
        brandName: "Bottega Veneta",
        model: "Fourre-Tout Leather tote",
        year: "",
        photo: "3817587c-b572-4eb9-8729-e46119413e54.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/fH4RsoTCThm-WDXDDAbb9Q/V9tMXCmWtY4IXA-S4nK_1ebcC3D9qBoE9pZnvp2VBfJ6yUc59-Y3pcT6Mv6BMYq56jDXX2YLhIxrg1MayF41PQy67Tk-d_ae_npoZpmlQa4ZrLGBAu2_DGFo4OM53j9cFZgZ17lV4p9Jb1pc71VGGPZwCYww31ttlV_IQ2X382OvVdxVhIsSv4BRopLebW_1/3HbPATAkgZ5dBw00ioJ17DkvOLKfgUIojryw602ULcI)",
        receiptPhoto: "",
        seller: "",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/oxta34Ndyp-hBN40w2KljQ/Fr2l3YuFBhKwA-phNwQXQuDt6UEp3doR9Sllp5GAwgUrYvqEXZoMI5Qn6gN8gAyooKCn1N38fLpXqEJjFEYxFPM-gZe745ySatXBG3Gym_VemFnq58JCkgwur8f_OsMf3ugzVFOb6CQNyTySZr2YtQ/sXJzgMmTWTZx2qrYuNFbETJQQDpA9PBRUuNU2GNUHuQ)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "",
        photographed: "",
    },
    {
        bag: "Chloé Bow-Chloe-",
        brandName: "Chloe",
        model: "Chloé Bow",
        year: "",
        photo: "83ea8067-df3c-458f-991b-40785728d782.jpeg (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/4Qp49qrMMG4sChveCwrbFg/B-6UsM92CNH25VdxPm_jN1AMVEaaEKTdqqgXbn_bU9R-o3vVBtVxiKBVJurawwGrCs1Z_BGRvRD1dxE8YA92baROk3NO9O2FjH_1iNxHfuPc97E1pL2RuZnLRzvxB3S7qiwWYgdeOb-Iun0qI7fiZ-nNkgszzqL2VJhJhMVKBCptNNX_rE9KwZMQ0i-uL1MT/-DIZwatX0elupKMrbKTXAZIjmD5p9EKLw-imTNkD4Rg)",
        receiptPhoto: "",
        seller: "",
        priceEstimator: "image.png (https://v5.airtableusercontent.com/v3/u/50/50/1770127200000/Icu0W5RoGtvUd3QuPE5XHA/opIui4GErycMyBccZxgNmfM7kx5JNIcrouTh0_jjIcXQeAH09bu6655aeGvhdEFFRcMsTwQHRWFj4EOybJo30JFR9-V_vtA88Zq3eusGKwEbS5-WsNBT7HJVhNzupicQ2eBJmXbL5cyBNX573qwjrw/RhwszlA7HUro-jJ8u_z8M4ZS_ehRrFRnU7MOjoA8C1Y)",
        quote: "",
        approved: "",
        approvedNextDrop: "",
        authNeeded: "",
        cleaningNeeded: "",
        listingPrice: "",
        photographed: "",
    },
];
function bulkImportItems() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(process.env.MONGODB_URI);
            console.log("Connected to MongoDB");
            // Get or create a default category (bags category)
            let defaultCategory = yield Category_1.default.findOne({ name: "Bags" });
            if (!defaultCategory) {
                defaultCategory = yield Category_1.default.create({
                    name: "Bags",
                    base_rate: "0",
                    op_rate: "0",
                    clean_rate: "0",
                });
                console.log("Created default 'Bags' category");
            }
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            const results = {
                success: [],
                failed: [],
            };
            // Prefer CSV (excluding already-have); fall back to hardcoded itemsData (also excluding already-have)
            let itemsToImport = loadItemsFromCsv();
            if (itemsToImport.length === 0) {
                console.log("No rows from CSV; using hardcoded itemsData and excluding already-have.");
                itemsToImport = itemsData.filter((item) => !isAlreadyHave(item.brandName, item.model || item.bag.split("-")[0] || ""));
            }
            else {
                console.log(`Loaded ${itemsToImport.length} rows from CSV (excluding ${ALREADY_HAVE_ITEMS.length} already-have).`);
            }
            for (const itemData of itemsToImport) {
                try {
                    // Find seller by email (optional - can be patched later)
                    let seller = null;
                    let sellerUserId = undefined;
                    const sellerEmail = sellerMap[itemData.seller] || itemData.seller;
                    if (sellerEmail && sellerEmail.trim() !== "") {
                        try {
                            const sellerUser = yield User_1.default.findOne({
                                emailAddress: sellerEmail,
                                isDeleted: false,
                            }).session(session);
                            if (sellerUser) {
                                seller = yield Seller_1.default.findOne({ userId: sellerUser._id }).session(session);
                                sellerUserId = sellerUser._id;
                            }
                        }
                        catch (error) {
                            // Seller lookup failed, continue without seller (will be patched later)
                            console.log(`Note: Could not find seller for ${itemData.seller}, item will be created without seller_id`);
                        }
                    }
                    // Extract URLs
                    const imageUrls = parseUrls(itemData.photo);
                    const receiptPhotoUrls = parseUrls(itemData.receiptPhoto);
                    const priceEstimatorUrls = parseUrls(itemData.priceEstimator);
                    const quoteUrls = parseUrls(itemData.quote);
                    if (imageUrls.length === 0) {
                        console.log(`Skipping ${itemData.bag}: No image URLs`);
                        results.failed.push(Object.assign(Object.assign({}, itemData), { error: "No image URLs" }));
                        continue;
                    }
                    // Create item: one brand field (brandName); price from CSV (listingPrice used for both basePrice and listingPrice — you may have different prices per source)
                    const listingPriceParsed = parseListingPrice(itemData.listingPrice);
                    const newItem = yield Item_1.default.create([
                        {
                            basePrice: listingPriceParsed || "0",
                            condition: itemEnums_1.ItemCondition.LikeNew, // Default
                            uploadedAt: new Date(),
                            saleRate: "0", // Default
                            itemStatus: normalizeBoolean(itemData.approved)
                                ? statusEnums_1.ItemStatus.Approved
                                : statusEnums_1.ItemStatus.Pending,
                            color: "Unknown", // Default
                            size: "Unknown", // Default
                            itemName: (itemData.bag && itemData.bag.split("-")[0].trim()) ||
                                itemData.model ||
                                "Unknown",
                            itemModel: itemData.model || undefined,
                            year: parseYear(itemData.year),
                            quantity: "1", // Default
                            brandName: itemData.brandName,
                            imageUrls,
                            receiptPhotoUrls: receiptPhotoUrls.length > 0 ? receiptPhotoUrls : undefined,
                            priceEstimatorUrls: priceEstimatorUrls.length > 0 ? priceEstimatorUrls : undefined,
                            quoteUrls: quoteUrls.length > 0 ? quoteUrls : undefined,
                            approved: normalizeBoolean(itemData.approved),
                            approvedNextDrop: normalizeBoolean(itemData.approvedNextDrop),
                            authNeeded: normalizeBoolean(itemData.authNeeded),
                            cleaningNeeded: normalizeBoolean(itemData.cleaningNeeded),
                            listingPrice: listingPriceParsed || "0",
                            photographed: normalizeBoolean(itemData.photographed),
                            seller_id: sellerUserId, // Optional - can be patched later if not found
                            category_id: defaultCategory._id,
                        },
                    ], { session });
                    // Update seller's itemIds if seller exists
                    if (seller) {
                        yield Seller_1.default.findByIdAndUpdate(seller._id, { $addToSet: { itemIds: newItem[0]._id } }, { session });
                    }
                    results.success.push({
                        itemName: itemData.bag,
                        itemId: newItem[0]._id.toString(),
                    });
                    console.log(`✓ Created item: ${itemData.bag}`);
                }
                catch (error) {
                    console.error(`✗ Failed to create item ${itemData.bag}:`, error.message);
                    results.failed.push(Object.assign(Object.assign({}, itemData), { error: error.message }));
                }
            }
            yield session.commitTransaction();
            session.endSession();
            console.log("\n=== Import Summary ===");
            console.log(`Success: ${results.success.length}`);
            console.log(`Failed: ${results.failed.length}`);
            if (results.failed.length > 0) {
                console.log("\nFailed entries:");
                results.failed.forEach((entry) => {
                    console.log(`  - ${entry.bag || "Unknown"}: ${entry.error}`);
                });
            }
            yield mongoose_1.default.disconnect();
            console.log("\nDisconnected from MongoDB");
        }
        catch (error) {
            console.error("Error in bulk import:", error);
            process.exit(1);
        }
    });
}
// Run the import
bulkImportItems();
