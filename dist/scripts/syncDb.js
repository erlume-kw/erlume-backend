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
 * Standalone script: connect to MongoDB, ensure all model collections exist,
 * and sync indexes. Run with: npm run sync-db
 * Uses MONGODB_URI from .env.
 */
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = __importStar(require("../config/db"));
// Import all models so they register with Mongoose (required for modelNames())
require("../models/User");
require("../models/Seller");
require("../models/Category");
require("../models/SubCategory");
require("../models/Demand");
require("../models/DiscountCode");
require("../models/Drop");
require("../models/Item");
require("../models/Order");
require("../models/OrderItem");
require("../models/Transaction");
require("../models/Sale");
require("../models/Income");
require("../models/Expense");
require("../models/CreditCard");
require("../models/Outfit");
require("../models/OutfitItem");
require("../models/Review");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.default)();
        yield (0, db_1.ensureCollections)();
        yield (0, db_1.syncIndexes)();
        yield mongoose_1.default.disconnect();
        console.log("MongoDB sync complete. Disconnected.");
        process.exit(0);
    });
}
main().catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
});
