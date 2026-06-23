import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
	if (mongoose.connection.readyState === 1) return; // already connected
	try {
		const conn = await mongoose.connect(process.env.MONGODB_URI as string);
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error(`MongoDB connection error: ${message}`);
		process.exit(1);
	}
};

/**
 * Ensure every registered Mongoose model has a collection in MongoDB.
 * Collections are created empty if they don't exist (e.g. before first insert).
 */
export const ensureCollections = async (): Promise<void> => {
	const names = mongoose.connection.modelNames();
	for (const name of names) {
		const Model = mongoose.connection.model(name);
		await Model.createCollection();
	}
	console.log(`MongoDB: ensured ${names.length} collections (${names.join(", ")})`);
};

/**
 * Sync indexes for all registered models: creates missing indexes in MongoDB
 * and drops indexes that are no longer in the schema.
 */
export const syncIndexes = async (): Promise<void> => {
	const names = mongoose.connection.modelNames();
	for (const name of names) {
		const Model = mongoose.connection.model(name);
		await Model.syncIndexes();
	}
	console.log(`MongoDB: synced indexes for ${names.length} models`);
};

export default connectDB;
