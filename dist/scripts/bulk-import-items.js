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
const Item_1 = __importDefault(require("../models/Item"));
const Seller_1 = __importDefault(require("../models/Seller"));
const User_1 = __importDefault(require("../models/User"));
const Category_1 = __importDefault(require("../models/Category"));
const itemEnums_1 = require("../enums/itemEnums");
const statusEnums_1 = require("../enums/statusEnums");
dotenv_1.default.config();
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
        if (field.trim().startsWith("http://") || field.trim().startsWith("https://")) {
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
    return normalized === "checked" || normalized === "true" || normalized === "yes" || normalized === "1";
}
// Parse listing price (remove "KWD" prefix if present)
function parseListingPrice(price) {
    if (!price || price.trim() === "")
        return "0";
    return price.replace(/^KWD\s*/i, "").replace(/,/g, "").trim();
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
    "Mariam": "Mraiam@gmail.com",
    "Mariam ": "Mraiam@gmail.com",
    "Faisal Almutery": "faisal99669966@gmail.com",
    "amna_72@icloud.com": "amnahidr6@gmail.com",
    "Zahra": "",
    "Zahra ": "",
};
// Items data (parsed from CSV)
const itemsData = [
    {
        bag: "Speedy Soft 30-Louis Vuitton-2020",
        brand: "Louis Vuitton",
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
        brand: "Louis Vuitton",
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
        brand: "Louis Vuitton",
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
        brand: "Pedro",
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
        brand: "Fendi",
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
            // Process items (for now, using a simplified version - you'll need to add all items from CSV)
            for (const itemData of itemsData) {
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
                    // Create item with defaults
                    const newItem = yield Item_1.default.create([
                        {
                            basePrice: "0", // Default, can be updated later
                            condition: itemEnums_1.ItemCondition.LikeNew, // Default
                            uploadedAt: new Date(),
                            saleRate: "0", // Default
                            itemStatus: normalizeBoolean(itemData.approved) ? statusEnums_1.ItemStatus.Approved : statusEnums_1.ItemStatus.Pending,
                            color: "Unknown", // Default
                            size: "Unknown", // Default
                            itemName: itemData.bag.split("-")[0].trim(), // Extract bag name
                            itemModel: itemData.model || undefined,
                            year: parseYear(itemData.year),
                            quantity: "1", // Default
                            brandName: itemData.brand,
                            imageUrls,
                            receiptPhotoUrls: receiptPhotoUrls.length > 0 ? receiptPhotoUrls : undefined,
                            priceEstimatorUrls: priceEstimatorUrls.length > 0 ? priceEstimatorUrls : undefined,
                            quoteUrls: quoteUrls.length > 0 ? quoteUrls : undefined,
                            approved: normalizeBoolean(itemData.approved),
                            approvedNextDrop: normalizeBoolean(itemData.approvedNextDrop),
                            authNeeded: normalizeBoolean(itemData.authNeeded),
                            cleaningNeeded: normalizeBoolean(itemData.cleaningNeeded),
                            listingPrice: parseListingPrice(itemData.listingPrice),
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
