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
exports.syncIndexes = exports.ensureCollections = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const conn = yield mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`MongoDB connection error: ${message}`);
        process.exit(1);
    }
});
/**
 * Ensure every registered Mongoose model has a collection in MongoDB.
 * Collections are created empty if they don't exist (e.g. before first insert).
 */
const ensureCollections = () => __awaiter(void 0, void 0, void 0, function* () {
    const names = mongoose_1.default.connection.modelNames();
    for (const name of names) {
        const Model = mongoose_1.default.connection.model(name);
        yield Model.createCollection();
    }
    console.log(`MongoDB: ensured ${names.length} collections (${names.join(", ")})`);
});
exports.ensureCollections = ensureCollections;
/**
 * Sync indexes for all registered models: creates missing indexes in MongoDB
 * and drops indexes that are no longer in the schema.
 */
const syncIndexes = () => __awaiter(void 0, void 0, void 0, function* () {
    const names = mongoose_1.default.connection.modelNames();
    for (const name of names) {
        const Model = mongoose_1.default.connection.model(name);
        yield Model.syncIndexes();
    }
    console.log(`MongoDB: synced indexes for ${names.length} models`);
});
exports.syncIndexes = syncIndexes;
exports.default = connectDB;
