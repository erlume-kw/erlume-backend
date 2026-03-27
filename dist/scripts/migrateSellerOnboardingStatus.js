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
/**
 * Migration: backfill onboardingStatus and itemsOnboardingStatus on all Seller documents
 * that were created before these fields were added.
 *
 * Run with: npx ts-node src/scripts/migrateSellerOnboardingStatus.ts
 */
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const Seller_1 = __importDefault(require("../models/Seller"));
const sellerEnums_1 = require("../enums/sellerEnums");
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not set in .env");
        process.exit(1);
    }
    yield mongoose_1.default.connect(uri);
    console.log("Connected to MongoDB");
    const result = yield Seller_1.default.updateMany({
        $or: [
            { onboardingStatus: { $exists: false } },
            { onboardingStatus: null },
            { itemsOnboardingStatus: { $exists: false } },
            { itemsOnboardingStatus: null },
        ],
    }, [
        {
            $set: {
                onboardingStatus: {
                    $ifNull: ["$onboardingStatus", sellerEnums_1.SellerOnboardingStatus.InitialContact],
                },
                itemsOnboardingStatus: {
                    $ifNull: ["$itemsOnboardingStatus", sellerEnums_1.ItemsOnboardingStatus.NoItems],
                },
            },
        },
    ]);
    console.log(`Updated ${result.modifiedCount} seller(s).`);
    yield mongoose_1.default.disconnect();
});
run().catch((err) => {
    console.error(err);
    process.exit(1);
});
