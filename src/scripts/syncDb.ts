/**
 * Standalone script: connect to MongoDB, ensure all model collections exist,
 * and sync indexes. Run with: npm run sync-db
 * Uses MONGODB_URI from .env.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB, {
	ensureCollections,
	syncIndexes,
} from "../config/db";

// Import all models so they register with Mongoose (required for modelNames())
import "../models/User";
import "../models/Seller";
import "../models/Category";
import "../models/SubCategory";
import "../models/Demand";
import "../models/DiscountCode";
import "../models/Drop";
import "../models/Item";
import "../models/Order";
import "../models/OrderItem";
import "../models/Transaction";
import "../models/Sale";
import "../models/Income";
import "../models/Expense";
import "../models/CreditCard";
import "../models/Outfit";
import "../models/OutfitItem";
import "../models/Review";
import "../models/Employee";

async function main(): Promise<void> {
	await connectDB();
	await ensureCollections();
	await syncIndexes();
	await mongoose.disconnect();
	console.log("MongoDB sync complete. Disconnected.");
	process.exit(0);
}

main().catch((err) => {
	console.error("Sync failed:", err);
	process.exit(1);
});
