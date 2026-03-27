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
const User_1 = __importDefault(require("../models/User"));
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(process.env.MONGODB_URI);
    const sellers = yield Seller_1.default.find({}).lean();
    const results = yield Promise.all(sellers.map((s) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const user = yield User_1.default.findById(s.userId).lean();
        return {
            sellerId: String(s._id),
            email: (_a = user === null || user === void 0 ? void 0 : user.emailAddress) !== null && _a !== void 0 ? _a : "—",
            onboardingStatus: (_b = s.onboardingStatus) !== null && _b !== void 0 ? _b : "—",
            itemsOnboardingStatus: (_c = s.itemsOnboardingStatus) !== null && _c !== void 0 ? _c : "—",
        };
    })));
    console.table(results);
    yield mongoose_1.default.disconnect();
});
run().catch(console.error);
