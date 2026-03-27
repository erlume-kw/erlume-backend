/**
 * Migration: backfill onboardingStatus and itemsOnboardingStatus on all Seller documents
 * that were created before these fields were added.
 *
 * Run with: npx ts-node src/scripts/migrateSellerOnboardingStatus.ts
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Seller from "../models/Seller";
import { SellerOnboardingStatus, ItemsOnboardingStatus } from "../enums/sellerEnums";

const run = async () => {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		console.error("MONGODB_URI not set in .env");
		process.exit(1);
	}

	await mongoose.connect(uri);
	console.log("Connected to MongoDB");

	const result = await Seller.updateMany(
		{
			$or: [
				{ onboardingStatus: { $exists: false } },
				{ onboardingStatus: null },
				{ itemsOnboardingStatus: { $exists: false } },
				{ itemsOnboardingStatus: null },
			],
		},
		[
			{
				$set: {
					onboardingStatus: {
						$ifNull: ["$onboardingStatus", SellerOnboardingStatus.InitialContact],
					},
					itemsOnboardingStatus: {
						$ifNull: ["$itemsOnboardingStatus", ItemsOnboardingStatus.NoItems],
					},
				},
			},
		],
	);

	console.log(`Updated ${result.modifiedCount} seller(s).`);
	await mongoose.disconnect();
};

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
