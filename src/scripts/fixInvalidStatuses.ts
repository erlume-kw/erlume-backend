import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Seller from "../models/Seller";

const run = async () => {
	await mongoose.connect(process.env.MONGODB_URI!);

	const r1 = await Seller.updateMany(
		{ itemsOnboardingStatus: "listed" },
		{ $set: { itemsOnboardingStatus: "items_listed" } },
	);
	console.log(`Fixed 'listed' → 'items_listed': ${r1.modifiedCount} record(s)`);

	const r2 = await Seller.updateMany(
		{ onboardingStatus: { $in: ["ready fo piuckup", "ready for pickup"] } },
		{ $set: { onboardingStatus: "ready_for_pickup" } },
	);
	console.log(`Fixed typo → 'ready_for_pickup': ${r2.modifiedCount} record(s)`);

	const r3 = await Seller.updateMany(
		{ itemsOnboardingStatus: { $in: ["ready fo piuckup", "ready for pickup"] } },
		{ $set: { itemsOnboardingStatus: "items_listed" } },
	);
	console.log(`Fixed items typo: ${r3.modifiedCount} record(s)`);

	await mongoose.disconnect();
};

run().catch(console.error);
