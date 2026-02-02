import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Seller from "../models/Seller";
import User from "../models/User";
import { UserRole } from "../enums/userEnums";

const getSellers = async (req: Request, res: Response): Promise<void> => {
	try {
		const includeDeactivated =
			(req.query.includeDeactivated as string) === "true";
		const filter = includeDeactivated ? {} : { isDeactivated: false };
		const sellers = await Seller.find(filter).lean();
		res
			.status(200)
			.json({ success: true, data: sellers, count: sellers.length });
	} catch (error) {
		console.error("Error in getSellers:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getSellerById = async (req: Request, res: Response): Promise<void> => {
	try {
		const id = req.params.id;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, error: "Invalid seller ID" });
			return;
		}
		// Accept either Seller _id or userId (user id)
		let seller = await Seller.findById(id).lean();
		if (!seller) {
			seller = await Seller.findOne({ userId: id }).lean();
		}
		if (!seller) {
			res.status(404).json({ success: false, error: "Seller not found" });
			return;
		}
		res.status(200).json({ success: true, data: seller });
	} catch (error) {
		console.error("Error in getSellerById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createSeller = async (req: Request, res: Response): Promise<void> => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const {
			password,
			emailAddress,
			phoneNumber,
			address,
			consentGiven,
			preferredPickupDate,
			fullName,
			addressText,
			intakeTimestamp,
		} = req.body;

		if (!password || !emailAddress || !phoneNumber || !address) {
			res.status(400).json({
				success: false,
				error:
					"Missing required fields: password, emailAddress, phoneNumber, address",
			});
			return;
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await User.create(
			[
				{
					password: hashedPassword,
					emailAddress,
					phoneNumber,
					address,
					roles: [UserRole.SELLER],
					isDeleted: false,
				},
			],
			{ session },
		);

		const normalizeConsent = (value: unknown): boolean => {
			if (typeof value === "string") {
				const normalized = value.trim().toLowerCase();
				if (
					normalized === "true" ||
					normalized === "yes" ||
					normalized === "y" ||
					normalized === "نعم" ||
					normalized === "yes / نعم"
				) {
					return true;
				}
				if (
					normalized === "false" ||
					normalized === "no" ||
					normalized === "n" ||
					normalized === "لا" ||
					normalized === "no / لا"
				) {
					return false;
				}
			}
			return value === true;
		};

		const sellerData = {
			userId: user[0]._id,
			fullName: fullName ?? "",
			emailAddress,
			phoneNumber,
			addressText: addressText ?? "",
			balance: "0",
			itemIds: [],
			IBAN: "",
			qrCode: "",
			isDeactivated: false,
			consentGiven: normalizeConsent(consentGiven),
			preferredPickupDate:
				preferredPickupDate !== undefined ? preferredPickupDate : "",
			intakeTimestamp,
		};

		const [sellerDoc] = await Seller.create([sellerData], { session });
		sellerDoc.markModified("consentGiven");
		sellerDoc.markModified("preferredPickupDate");

		await session.commitTransaction();

		res.status(201).json({
			success: true,
			data: { user: user[0], seller: sellerDoc },
		});
	} catch (error) {
		await session.abortTransaction();
		console.error("Error in createSeller:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	} finally {
		session.endSession();
	}
};

const deleteSeller = async (req: Request, res: Response): Promise<void> => {
	try {
		const id = req.params.id;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, error: "Invalid seller ID" });
			return;
		}
		// Resolve to userId: id may be Seller._id or userId
		let userId: mongoose.Types.ObjectId | null = null;
		const sellerById = await Seller.findById(id);
		if (sellerById) {
			userId = sellerById.userId;
		} else {
			const sellerByUserId = await Seller.findOne({ userId: id });
			if (sellerByUserId) userId = sellerByUserId.userId;
			else userId = new mongoose.Types.ObjectId(id);
		}
		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ success: false, error: "Seller/User not found" });
			return;
		}
		if (!user.roles.includes(UserRole.SELLER)) {
			res.status(404).json({ success: false, error: "User is not a seller" });
			return;
		}
		await User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
		await Seller.updateOne({ userId }, { isDeactivated: true });
		res.status(200).json({
			success: true,
			message: "Seller deactivated and user soft-deleted",
		});
	} catch (error) {
		console.error("Error in deleteSeller:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getSellers,
	getSellerById,
	createSeller,
	deleteSeller,
};
