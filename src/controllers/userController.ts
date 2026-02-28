import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";
import Seller from "../models/Seller";
import { UserRole } from "../enums/userEnums";
import { EscalationStatus } from "../enums/flowEnums";

/* =========================
   Helpers
========================= */

const formatSellerResponse = (seller: any) => {
	// Always include these fields, even if they don't exist in the document
	const response: any = { ...seller };

	// Handle consentGiven - always include it explicitly
	// Check if it exists and is true, otherwise set to empty string
	if (
		seller.consentGiven === true ||
		seller.consentGiven === "true" ||
		seller.consentGiven === 1
	) {
		response.consentGiven = "true";
	} else {
		// Always set to empty string if false, undefined, null, or missing
		response.consentGiven = "";
	}

	// Handle preferredPickupDate - always include it explicitly
	if (
		seller.preferredPickupDate &&
		seller.preferredPickupDate !== null &&
		seller.preferredPickupDate !== undefined &&
		String(seller.preferredPickupDate).trim() !== ""
	) {
		response.preferredPickupDate = String(seller.preferredPickupDate);
	} else {
		// Always set to empty string if missing, null, undefined, or empty
		response.preferredPickupDate = "";
	}

	return response;
};

const createSeller = async (
	userId: Types.ObjectId,
	data?: {
		consentGiven?: boolean;
		preferredPickupDate?: string;
	},
	session?: mongoose.ClientSession,
) => {
	const sellerData = {
		userId,
		balance: "0",
		itemIds: [],
		IBAN: "",
		qrCode: "",
		isDeactivated: false,
		consentGiven: data?.consentGiven !== undefined ? data.consentGiven : false,
		preferredPickupDate:
			data?.preferredPickupDate !== undefined ? data.preferredPickupDate : "",
	};

	const [sellerDoc] = await Seller.create([sellerData], { session });

	// Explicitly mark fields as modified to ensure they're saved
	sellerDoc.markModified("consentGiven");
	sellerDoc.markModified("preferredPickupDate");

	return [sellerDoc];
};

/* =========================
   GET USERS
========================= */

const getUsers = async (req: Request, res: Response) => {
	const { includeDeleted, role } = req.query;

	// Build query - include deleted users if requested
	const query: any = {};

	// Only filter by isDeleted if includeDeleted is not explicitly "true"
	if (includeDeleted === "true") {
		// Include all users (deleted and non-deleted) - no filter
	} else {
		// Default: only show non-deleted users
		query.isDeleted = false;
	}

	if (role) {
		query.roles = role;
	}

	console.log("getUsers query:", query, "includeDeleted:", includeDeleted);

	const users = await User.find(query).lean();

	const result = await Promise.all(
		users.map(async (user) => {
			if (!user.roles.includes(UserRole.SELLER)) return user;

			const seller = await Seller.findOne({ userId: user._id }).lean();
			return {
				...user,
				seller: seller ? formatSellerResponse(seller) : null,
			};
		}),
	);

	res.json({
		success: true,
		data: result,
		count: result.length,
		includeDeleted: includeDeleted === "true",
	});
};

/* =========================
   GET USER BY ID
========================= */

const getUserById = async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		res.status(400).json({ error: "Invalid ID" });
		return;
	}

	const user = await User.findById(id).lean();
	if (!user) {
		res.status(404).json({ error: "User not found" });
		return;
	}

	let seller = null;
	if (user.roles.includes(UserRole.SELLER)) {
		const sellerDoc = await Seller.findOne({ userId: user._id }).lean();
		if (sellerDoc) seller = formatSellerResponse(sellerDoc);
	}

	res.json({ success: true, data: { user, seller } });
};

/* =========================
   CREATE USER
========================= */

const createUser = async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const {
			password,
			emailAddress,
			phoneNumber,
			address,
			roles,
			consentGiven,
			preferredPickupDate,
		} = req.body;

		if (!password || !emailAddress || !phoneNumber || !address) {
			res.status(400).json({
				success: false,
				error:
					"Missing required fields: password, emailAddress, phoneNumber, address",
			});
			return;
		}

		// Normalize roles to lowercase so "SELLER" / "seller" both work
		const normalizedRoles = Array.isArray(roles)
			? roles.map((r: string) => (typeof r === "string" ? r.toLowerCase() : r))
			: [UserRole.USER];

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await User.create(
			[
				{
					password: hashedPassword,
					emailAddress: emailAddress.trim(),
					phoneNumber: String(phoneNumber)
						.trim()
						.replace(/[\s\-]/g, ""),
					address,
					roles: normalizedRoles,
					isDeleted: false,
				},
			],
			{ session },
		);

		let seller = null;
		if (normalizedRoles.includes(UserRole.SELLER)) {
			// Handle consentGiven properly - only true if explicitly true or "true"
			let consentBool = false;
			if (consentGiven !== undefined && consentGiven !== null) {
				if (typeof consentGiven === "string") {
					consentBool = consentGiven.toLowerCase() === "true";
				} else if (typeof consentGiven === "boolean") {
					consentBool = consentGiven;
				} else {
					consentBool = consentGiven === true;
				}
			}

			const [sellerDoc] = await createSeller(
				user[0]._id as Types.ObjectId,
				{
					consentGiven: consentBool,
					preferredPickupDate: preferredPickupDate ?? "",
				},
				session,
			);
			seller = formatSellerResponse(sellerDoc.toObject());
		}

		await session.commitTransaction();

		res.status(201).json({
			success: true,
			data: {
				user: user[0],
				seller,
			},
		});
	} catch (err: any) {
		await session.abortTransaction();
		console.error("createUser error:", err);
		const message =
			err?.message ||
			err?.errors?.phoneNumber?.message ||
			err?.errors?.emailAddress?.message ||
			err?.errors?.address?.message ||
			"Internal server error";
		const status =
			err?.name === "ValidationError" || err?.code === 11000 ? 400 : 500;
		res.status(status).json({
			success: false,
			error: message,
			...(err?.errors && { details: err.errors }),
		});
	} finally {
		session.endSession();
	}
};

/* =========================
   UPDATE USER
========================= */

const updateUser = async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		res.status(400).json({ error: "Invalid ID" });
		return;
	}

	const update = { ...req.body };
	delete update.roles;

	if (update.password) {
		update.password = await bcrypt.hash(update.password, 10);
	}

	const user = await User.findByIdAndUpdate(id, update, {
		new: true,
		runValidators: true,
	});

	if (!user) {
		res.status(404).json({ error: "User not found" });
		return;
	}

	let seller = null;
	if (user.roles.includes(UserRole.SELLER)) {
		const sellerDoc = await Seller.findOne({ userId: user._id }).lean();
		if (sellerDoc) seller = formatSellerResponse(sellerDoc);
	}

	res.json({ success: true, data: { user, seller } });
};

/* =========================
   UPDATE SELLER (PATCH SAFE)
========================= */

const updateSellerInfo = async (req: Request, res: Response) => {
	const { id } = req.params;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		res.status(400).json({ error: "Invalid ID" });
		return;
	}

	const user = await User.findById(id);
	if (!user || !user.roles.includes(UserRole.SELLER)) {
		res.status(404).json({ error: "Seller not found" });
		return;
	}

	const update: any = {};

	if ("consentGiven" in req.body) {
		const consentValue = req.body.consentGiven;
		if (typeof consentValue === "string") {
			update.consentGiven = consentValue.toLowerCase() === "true";
		} else if (typeof consentValue === "boolean") {
			update.consentGiven = consentValue;
		} else {
			// Only set to true if explicitly true, otherwise false
			update.consentGiven = consentValue === true;
		}
	}

	if ("preferredPickupDate" in req.body) {
		update.preferredPickupDate = req.body.preferredPickupDate ?? "";
	}

	if ("IBAN" in req.body) {
		update.IBAN = req.body.IBAN;
		update.qrCode = `QR_${req.body.IBAN}`;
	}

	if ("balance" in req.body) {
		update.balance = req.body.balance;
	}

	if ("sellerPolicyAcceptedAt" in req.body) {
		const val = req.body.sellerPolicyAcceptedAt;
		update.sellerPolicyAcceptedAt =
			val == null || val === "" ? undefined : new Date(val);
	}

	if ("escalationStatus" in req.body) {
		const val = req.body.escalationStatus;
		if (
			val != null &&
			val !== "" &&
			!Object.values(EscalationStatus).includes(val)
		) {
			res.status(400).json({
				error: `Invalid escalationStatus. Must be one of: ${Object.values(
					EscalationStatus,
				).join(", ")}`,
			});
			return;
		}
		update.escalationStatus = val == null || val === "" ? undefined : val;
	}

	if ("escalationNotes" in req.body) {
		update.escalationNotes = req.body.escalationNotes ?? "";
	}

	const seller = await Seller.findOneAndUpdate(
		{ userId: user._id },
		{ $set: update },
		{ new: true, upsert: true, runValidators: true },
	);

	res.json({
		success: true,
		data: formatSellerResponse(seller.toObject()),
	});
};

/* =========================
   DELETE USER (SOFT)
========================= */

const deleteUser = async (req: Request, res: Response) => {
	const { id } = req.params;

	const user = await User.findByIdAndUpdate(
		id,
		{ isDeleted: true },
		{ new: true },
	);

	if (!user) {
		res.status(404).json({ error: "User not found" });
		return;
	}

	if (user.roles.includes(UserRole.SELLER)) {
		await Seller.updateOne({ userId: user._id }, { isDeactivated: true });
	}

	res.json({ success: true });
};

/* =========================
   UPDATE ROLES
========================= */

const updateUserRoles = async (req: Request, res: Response) => {
	const { id } = req.params;
	const { roles } = req.body;

	const user = await User.findByIdAndUpdate(
		id,
		{ roles },
		{ new: true, runValidators: true },
	);

	if (!user) {
		res.status(404).json({ error: "User not found" });
		return;
	}

	if (roles.includes(UserRole.SELLER)) {
		await Seller.findOneAndUpdate({ userId: user._id }, {}, { upsert: true });
	}

	res.json({ success: true, data: user });
};

/* =========================
   EXPORT
========================= */

export default {
	getUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
	updateSellerInfo,
	updateUserRoles,
};
