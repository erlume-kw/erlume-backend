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
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(process.env.MONGODB_URI);
    const r1 = yield Seller_1.default.updateMany({ itemsOnboardingStatus: "listed" }, { $set: { itemsOnboardingStatus: "items_listed" } });
    console.log(`Fixed 'listed' → 'items_listed': ${r1.modifiedCount} record(s)`);
    const r2 = yield Seller_1.default.updateMany({ onboardingStatus: { $in: ["ready fo piuckup", "ready for pickup"] } }, { $set: { onboardingStatus: "ready_for_pickup" } });
    console.log(`Fixed typo → 'ready_for_pickup': ${r2.modifiedCount} record(s)`);
    const r3 = yield Seller_1.default.updateMany({ itemsOnboardingStatus: { $in: ["ready fo piuckup", "ready for pickup"] } }, { $set: { itemsOnboardingStatus: "items_listed" } });
    console.log(`Fixed items typo: ${r3.modifiedCount} record(s)`);
    yield mongoose_1.default.disconnect();
});
run().catch(console.error);
