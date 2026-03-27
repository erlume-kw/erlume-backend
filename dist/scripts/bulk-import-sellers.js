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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const Seller_1 = __importDefault(require("../models/Seller"));
const userEnums_1 = require("../enums/userEnums");
dotenv_1.default.config();
// Parse address text into structured address (fallback to defaults if parsing fails)
function parseAddress(addressText) {
    if (!addressText || addressText.trim() === "") {
        return {
            street: "Unknown",
            city: "Unknown",
            block: "Unknown",
            governorate: "Unknown",
            house: "Unknown",
        };
    }
    // Try to extract block number
    const blockMatch = addressText.match(/[Bb]lock\s*(\d+)/i);
    const block = blockMatch ? blockMatch[1] : "Unknown";
    // Try to extract street
    const streetMatch = addressText.match(/[Ss]treet\s*(\d+)/i) || addressText.match(/[Ss]t\.\s*(\d+)/i);
    const street = streetMatch ? `Street ${streetMatch[1]}` : "Unknown";
    // Try to extract house
    const houseMatch = addressText.match(/[Hh]ouse\s*(\d+)/i);
    const house = houseMatch ? houseMatch[1] : "Unknown";
    // Try to extract city/governorate from common Kuwait locations
    let city = "Unknown";
    let governorate = "Unknown";
    const locations = {
        salmiya: { city: "Salmiya", governorate: "Hawalli" },
        zahra: { city: "Zahra", governorate: "Hawalli" },
        surra: { city: "Surra", governorate: "Hawalli" },
        kaifan: { city: "Kaifan", governorate: "Kuwait City" },
        qortuba: { city: "Qortuba", governorate: "Hawalli" },
        qosour: { city: "Qosour", governorate: "Hawalli" },
        قرين: { city: "Qrain", governorate: "Hawalli" },
        القرين: { city: "Qrain", governorate: "Hawalli" },
        صباح: { city: "Sabah Al-Salem", governorate: "Mubarak Al-Kabeer" },
        الزهراء: { city: "Zahra", governorate: "Hawalli" },
    };
    const addressLower = addressText.toLowerCase();
    for (const [key, value] of Object.entries(locations)) {
        if (addressLower.includes(key.toLowerCase())) {
            city = value.city;
            governorate = value.governorate;
            break;
        }
    }
    return {
        street,
        city,
        block,
        governorate,
        house,
    };
}
// Normalize consent value
function normalizeConsent(consent) {
    if (!consent)
        return false;
    const normalized = consent.trim().toLowerCase();
    return (normalized === "true" ||
        normalized === "yes" ||
        normalized === "y" ||
        normalized === "نعم" ||
        normalized.includes("yes") ||
        normalized.includes("نعم"));
}
// Normalize phone number to match User model regex: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
// Format Kuwait numbers (8 digits) as: +965-XXX-XXXXX (3+3+5 format)
function normalizePhone(phone) {
    if (!phone)
        return "";
    // Remove +965, spaces, and other formatting
    let cleaned = phone.replace(/^\+965\s*/, "").replace(/\s+/g, "").replace(/[-\s.]/g, "").trim();
    // If it's 8 digits (Kuwait number), format as +965-XXX-XXXXX
    // The regex expects: 3 digits - 3 digits - 4-6 digits
    // So we format as: +965-666-51092 (first 3, then last 5)
    if (/^\d{8}$/.test(cleaned)) {
        return `+965-${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
    }
    // If it already has +965 prefix and is formatted, return as is
    if (cleaned.startsWith("965") && cleaned.length === 11) {
        return `+${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    // If it's already in the correct format, return as is
    if (/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone)) {
        return phone;
    }
    // Return cleaned if it's already valid
    return cleaned;
}
// Parse pickup date
function parsePickupDate(pickupDate) {
    if (!pickupDate || pickupDate.trim() === "" || pickupDate.toLowerCase() === "no need") {
        return "";
    }
    return pickupDate.trim();
}
// Seller data from CSV
const sellersData = [
    {
        fullName: "Huda Ali",
        email: "hudaalifouad@gmail.com",
        phone: "66651092",
        addressText: "Salmiya block 6 street 3",
        consent: "Yes / نعم",
        pickupDate: "Friday",
    },
    {
        fullName: "Faisal Al-Abdulhadi",
        email: "faisal.alabdulhadi1@gmail.com",
        phone: "94959551",
        addressText: "Zahra, Block 8, St. 45, House 57 Floor 1, Apt 5",
        consent: "Yes / نعم",
        pickupDate: "Monday",
    },
    {
        fullName: "Janna Almuqaisib",
        email: "jannakalmuqaisib@gmail.com",
        phone: "94499371",
        addressText: "Surra Block 4 Street 4 House 21",
        consent: "Yes / نعم",
        pickupDate: "No need",
    },
    {
        fullName: "Hanadi Alhindi",
        email: "fatmaboodai06@gmail.com",
        phone: "60956000",
        addressText: "صباح السالم قطعة ١٣ شارع١ جادة ٢ منزل 28",
        consent: "Yes / نعم",
        pickupDate: "No need",
    },
    {
        fullName: "عهود جابر حمد المري",
        email: "ohoudalmarri10@icloud.com",
        phone: "51333055",
        addressText: "القرين قطعه 1 شارع 26 منزل17",
        consent: "Yes / نعم",
        pickupDate: "Friday",
    },
    {
        fullName: "Tahreer al fadhli",
        email: "tahreeralf@gmail.com",
        phone: "51056575",
        addressText: "Qosour, Block 7, Street 13, House 46",
        consent: "Yes / نعم",
        pickupDate: "No need",
    },
    {
        fullName: "Nouf alshayji",
        email: "noufalshayjii@hotmail.com",
        phone: "50200664",
        addressText: "Kaifan block 4 street 45 house 16",
        consent: "Yes / نعم",
        pickupDate: "No need",
    },
    {
        fullName: "Nouf al subaie",
        email: "alsubaie.noufa@gmail.com",
        phone: "50229055",
        addressText: "Qortuba",
        consent: "Yes / نعم",
        pickupDate: "Thursday",
    },
    {
        fullName: "Mariam",
        email: "Mraiam@gmail.com",
        phone: "55334033",
        addressText: "Kaifan",
        consent: "Yes/ نعم",
        pickupDate: "Monday",
    },
    {
        fullName: "Faisal Almutery",
        email: "faisal99669966@gmail.com",
        phone: "66338859",
        addressText: "صباح السالم",
        consent: "Yes / نعم",
        pickupDate: "",
    },
    {
        fullName: "",
        email: "amnahidr6@gmail.com",
        phone: "90950619",
        addressText: "الزهراء ق٢ شارع ٢٣٠ منزل ١٨c دور٢",
        consent: "Yes / نعم",
        pickupDate: "",
    },
    {
        fullName: "Zahra",
        email: "",
        phone: "98821155",
        addressText: "",
        consent: "Yes / نعم",
        pickupDate: "No need",
    },
];
function bulkImportSellers() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            yield mongoose_1.default.connect(process.env.MONGODB_URI);
            console.log("Connected to MongoDB");
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            const results = {
                success: [],
                failed: [],
            };
            for (const sellerData of sellersData) {
                try {
                    // Skip if no email
                    if (!sellerData.email || sellerData.email.trim() === "") {
                        console.log(`Skipping ${sellerData.fullName || "Unknown"}: No email`);
                        results.failed.push(Object.assign(Object.assign({}, sellerData), { error: "No email address" }));
                        continue;
                    }
                    // Check if user already exists
                    const existingUser = yield User_1.default.findOne({
                        emailAddress: sellerData.email,
                        isDeleted: false,
                    }).session(session);
                    if (existingUser) {
                        console.log(`Skipping ${sellerData.email}: User already exists`);
                        results.failed.push(Object.assign(Object.assign({}, sellerData), { error: "User already exists" }));
                        continue;
                    }
                    // Normalize phone
                    const normalizedPhone = normalizePhone(sellerData.phone);
                    if (!normalizedPhone) {
                        console.log(`Skipping ${sellerData.email}: Invalid phone`);
                        results.failed.push(Object.assign(Object.assign({}, sellerData), { error: "Invalid phone number" }));
                        continue;
                    }
                    // Parse address
                    const address = parseAddress(sellerData.addressText);
                    // Generate default password (email-based for now, users should reset)
                    const defaultPassword = `Seller${Date.now()}${Math.random().toString(36).substring(7)}`;
                    const hashedPassword = yield bcryptjs_1.default.hash(defaultPassword, 10);
                    // Create user
                    const [user] = yield User_1.default.create([
                        {
                            password: hashedPassword,
                            emailAddress: sellerData.email,
                            phoneNumber: normalizedPhone,
                            address,
                            roles: [userEnums_1.UserRole.SELLER],
                            isDeleted: false,
                        },
                    ], { session });
                    // Create seller
                    const [seller] = yield Seller_1.default.create([
                        {
                            userId: user._id,
                            fullName: sellerData.fullName || "",
                            emailAddress: sellerData.email,
                            phoneNumber: normalizedPhone,
                            addressText: sellerData.addressText || "",
                            balance: "0",
                            itemIds: [],
                            IBAN: "",
                            qrCode: "",
                            isDeactivated: false,
                            consentGiven: normalizeConsent(sellerData.consent),
                            preferredPickupDate: parsePickupDate(sellerData.pickupDate),
                            intakeTimestamp: new Date().toISOString(),
                        },
                    ], { session });
                    results.success.push({
                        email: sellerData.email,
                        userId: user._id.toString(),
                        sellerId: seller._id.toString(),
                    });
                    console.log(`✓ Created seller: ${sellerData.email}`);
                }
                catch (error) {
                    console.error(`✗ Failed to create seller ${sellerData.email}:`, error.message);
                    results.failed.push(Object.assign(Object.assign({}, sellerData), { error: error.message }));
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
                    console.log(`  - ${entry.email || entry.fullName}: ${entry.error}`);
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
bulkImportSellers();
