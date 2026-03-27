import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Seller from "../models/Seller";
import User from "../models/User";

const run = async () => {
	await mongoose.connect(process.env.MONGODB_URI!);
	const sellers = await Seller.find({}).lean();
	const results = await Promise.all(
		sellers.map(async (s: any) => {
			const user = await User.findById(s.userId).lean() as any;
			return {
				sellerId: String(s._id),
				email: user?.emailAddress ?? "—",
				onboardingStatus: s.onboardingStatus ?? "—",
				itemsOnboardingStatus: s.itemsOnboardingStatus ?? "—",
			};
		}),
	);
	console.table(results);
	await mongoose.disconnect();
};

run().catch(console.error);
