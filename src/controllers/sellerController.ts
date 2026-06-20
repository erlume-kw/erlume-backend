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

const registerFromForm = async (req: Request, res: Response): Promise<void> => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const { fullName, emailAddress, phoneNumber, preferredPickupAddress, consent } = req.body;

		if (!fullName || !phoneNumber) {
			res.status(400).json({ success: false, error: "fullName and phoneNumber are required" });
			return;
		}

		// Reject if T&C not accepted
		const normalizeConsent = (v: unknown): boolean => {
			if (typeof v === "string") {
				const s = v.trim().toLowerCase();
				return s === "true" || s === "yes" || s === "yes / نعم" || s === "نعم";
			}
			return v === true;
		};

		if (!normalizeConsent(consent)) {
			res.status(400).json({ success: false, error: "Seller did not accept Terms & Conditions" });
			return;
		}

		// Check for duplicate email
		if (emailAddress) {
			const existing = await User.findOne({ emailAddress, isDeleted: false });
			if (existing) {
				res.status(409).json({ success: false, error: "A seller with this email already exists" });
				return;
			}
		}

		// Generate a random temp password — not shared with seller, team sets it later
		const tempPassword = await bcrypt.hash(
			Math.random().toString(36).slice(2) + Date.now(),
			10,
		);

		const [user] = await User.create(
			[{
				password:     tempPassword,
				emailAddress: emailAddress ?? `form-${Date.now()}@erlume.placeholder`,
				phoneNumber,
				roles:        [UserRole.SELLER],
				isDeleted:    false,
				address: {
					street:      preferredPickupAddress ?? "TBD",
					city:        "Kuwait",
					block:       "TBD",
					governorate: "Kuwait",
					house:       "TBD",
				},
			}],
			{ session },
		);

		const [seller] = await Seller.create(
			[{
				userId:                 user._id,
				fullName:               fullName ?? "",
				emailAddress:           emailAddress ?? "",
				phoneNumber,
				addressText:            preferredPickupAddress ?? "",
				balance:                "0",
				consentGiven:           true,
				sellerPolicyAcceptedAt: new Date(),
				onboardingStatus:       "initial_contact",
				isDeactivated:          false,
			}],
			{ session },
		);

		await session.commitTransaction();

		// Notify info@erlume.com.kw
		try {
			const { Resend } = await import("resend");
			const resend = new Resend(process.env.RESEND_API_KEY);
			await resend.emails.send({
				from:    process.env.RESEND_FROM ?? "orders@erlume.com.kw",
				to:      ["info@erlume.com.kw"],
				subject: `New seller registration — ${fullName}`,
				html: `
					<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
						<h2 style="color:#111d11;margin:0 0 20px;">New Seller Registered</h2>
						<table style="width:100%;border-collapse:collapse;font-size:14px;">
							<tr><td style="padding:8px 0;color:#666;width:140px;">Name</td><td style="padding:8px 0;font-weight:600;">${fullName}</td></tr>
							<tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${phoneNumber}</td></tr>
							<tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;">${emailAddress ?? "—"}</td></tr>
							<tr><td style="padding:8px 0;color:#666;">Pickup Address</td><td style="padding:8px 0;">${preferredPickupAddress ?? "—"}</td></tr>
							<tr><td style="padding:8px 0;color:#666;">T&C Accepted</td><td style="padding:8px 0;">✅ Yes</td></tr>
							<tr><td style="padding:8px 0;color:#666;">Seller ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px;">${String(seller._id)}</td></tr>
						</table>
						<div style="margin-top:28px;">
							<a href="${process.env.BACKOFFICE_URL ?? "http://localhost:5173"}/sellers/${String(seller._id)}" style="background:#111d11;color:#fff;padding:11px 24px;border-radius:5px;text-decoration:none;font-size:13px;">Complete Profile in Backoffice</a>
						</div>
						<p style="margin-top:24px;font-size:12px;color:#aaa;">Submitted via Google Form · ${new Date().toLocaleString("en-KW", { timeZone: "Asia/Kuwait" })}</p>
					</div>`,
			});
		} catch (emailErr) {
			console.error("[registerFromForm] Notification email failed:", emailErr);
		}

		res.status(201).json({
			success:  true,
			sellerId: String(seller._id),
			message:  "Seller registered. Erlume team notified to complete the profile.",
		});
	} catch (error: any) {
		await session.abortTransaction();
		console.error("Error in registerFromForm:", error);
		if (error.code === 11000) {
			res.status(409).json({ success: false, error: "A seller with this email already exists" });
		} else {
			res.status(500).json({ success: false, error: "Internal server error" });
		}
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
	registerFromForm,
	deleteSeller,
};
