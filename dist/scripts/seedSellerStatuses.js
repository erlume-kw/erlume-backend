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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const Seller_1 = __importDefault(require("../models/Seller"));
const updates = [
    // hudaalifouad@gmail.com (x2)
    { id: "695859157bfde4f7d9201685", onboardingStatus: "ready_for_pickup", itemsOnboardingStatus: "items_pending_pickup" },
    { id: "6981d5eba5029c958a51369a", onboardingStatus: "ready_for_pickup", itemsOnboardingStatus: "items_pending_pickup" },
    // seller@example.com
    { id: "69585b427bfde4f7d92016bc", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    // fatmah.boodai@eng.ku.edu.kw
    { id: "696124f52fb000a25f83618a", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    // bob@example.com (test records)
    { id: "69614a19958337fd36a939f6", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    { id: "69614aae958337fd36a93a05", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    { id: "69614bc2958337fd36a93a26", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    { id: "69614c8f9771c0b0855c9108", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    { id: "69614cb69771c0b0855c9110", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    // seller222@gmail.com
    { id: "69626903820361f9bc1b144d", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    // faisal.alabdulhadi1@gmail.com
    { id: "6981d5eca5029c958a5136a0", onboardingStatus: "onboarded", itemsOnboardingStatus: "items_listed" },
    // jannakalmuqaisib@gmail.com
    { id: "6981d5eca5029c958a5136a5", onboardingStatus: "onboarded", itemsOnboardingStatus: "items_listed" },
    // fatmaboodai06@gmail.com
    { id: "6981d5eda5029c958a5136aa", onboardingStatus: "onboarded", itemsOnboardingStatus: "items_listed" },
    // alsubaie.noufa@gmail.com
    { id: "6981d5f0a5029c958a5136be", onboardingStatus: "onboarded", itemsOnboardingStatus: "items_listed" },
    // amnahidr6@gmail.com
    { id: "6981d5f6a5029c958a5136cd", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    // noufalshayjii@hotmail.com
    { id: "6981d5efa5029c958a5136b9", onboardingStatus: "onboarded", itemsOnboardingStatus: "items_listed" },
    // Mraiam@gmail.com
    { id: "6981d5f2a5029c958a5136c3", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    // ohoudalmarri10@icloud.com
    { id: "6981d5eea5029c958a5136af", onboardingStatus: "onboarded", itemsOnboardingStatus: "items_listed" },
    // tahreeralf@gmail.com
    { id: "6981d5eea5029c958a5136b4", onboardingStatus: "onboarded", itemsOnboardingStatus: "items_listed" },
    // faisal99669966@gmail.com (x2)
    { id: "6981d5f3a5029c958a5136c8", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    { id: "698f833ba13adfbbd557b023", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    // zahra@gmail.com
    { id: "69873353eaeaaf392c08c292", onboardingStatus: "onboarded", itemsOnboardingStatus: "items_listed" },
    // mahabisalama@gmail.com (x2)
    { id: "69b36fea201fa46202e728ee", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
    { id: "69b376896c7c39362df6fd3e", onboardingStatus: "initial_contact", itemsOnboardingStatus: "no_items" },
];
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(process.env.MONGODB_URI);
    let updated = 0;
    for (const { id, onboardingStatus, itemsOnboardingStatus } of updates) {
        const result = yield Seller_1.default.updateOne({ _id: id }, { $set: { onboardingStatus, itemsOnboardingStatus } });
        if (result.modifiedCount)
            updated++;
    }
    console.log(`Done. Updated ${updated} / ${updates.length} sellers.`);
    yield mongoose_1.default.disconnect();
});
run().catch(console.error);
