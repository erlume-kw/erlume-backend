// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import RefreshToken from "../models/RefreshToken";
import OTP from "../models/OTP";
import { UserRole } from "../enums/userEnums";
import { sendOTP } from "../utils/notifications";

const ACCESS_SECRET = process.env.JWT_SECRET as string;
const ACCESS_EXPIRES_IN = "15m";

const REFRESH_SECRET = (process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET) as string;
const REFRESH_EXPIRES_DAYS = 30;

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(userId: string, roles: UserRole[]): string {
	return jwt.sign({ _id: userId, roles }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN } as any);
}

async function createRefreshToken(userId: string): Promise<string> {
	// Opaque random token (not JWT) — harder to decode, easy to revoke
	const token = crypto.randomBytes(64).toString("hex");
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

	await RefreshToken.create({ token, userId, expiresAt });
	return token;
}

// ─── Controller ───────────────────────────────────────────────────────────────

const authController = {
	async register(req: Request, res: Response): Promise<void> {
		const { password, emailAddress, phoneNumber, address, roles } = req.body;

		const existing = await User.findOne({ emailAddress, isDeleted: false });
		if (existing) {
			res.status(409).json({ success: false, error: "Email already in use", code: "DUPLICATE_KEY" });
			return;
		}

		const hashed = await bcrypt.hash(password, 12);
		const user = await User.create({
			password: hashed,
			emailAddress,
			phoneNumber,
			address,
			roles: roles ?? [UserRole.USER],
		});

		const accessToken = signAccessToken(String(user._id), user.roles as UserRole[]);
		const refreshToken = await createRefreshToken(String(user._id));

		res.status(201).json({
			success: true,
			accessToken,
			refreshToken,
			user: { _id: user._id, emailAddress: user.emailAddress, roles: user.roles },
		});
	},

	async login(req: Request, res: Response): Promise<void> {
		const { emailAddress, password } = req.body;

		const user = await User.findOne({ emailAddress, isDeleted: false }).select("+password");
		if (!user) {
			res.status(401).json({ success: false, error: "Invalid credentials", code: "UNAUTHORIZED" });
			return;
		}

		const valid = await bcrypt.compare(password, user.password as string);
		if (!valid) {
			res.status(401).json({ success: false, error: "Invalid credentials", code: "UNAUTHORIZED" });
			return;
		}

		const accessToken = signAccessToken(String(user._id), user.roles as UserRole[]);
		const refreshToken = await createRefreshToken(String(user._id));

		res.json({
			success: true,
			accessToken,
			refreshToken,
			user: { _id: user._id, emailAddress: user.emailAddress, roles: user.roles },
		});
	},

	async refresh(req: Request, res: Response): Promise<void> {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			res.status(401).json({ success: false, error: "Refresh token required" });
			return;
		}

		const stored = await RefreshToken.findOne({ token: refreshToken });

		if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
			res.status(401).json({ success: false, error: "Invalid or expired refresh token", code: "UNAUTHORIZED" });
			return;
		}

		const user = await User.findById(stored.userId).select("_id roles");
		if (!user) {
			res.status(401).json({ success: false, error: "User not found", code: "UNAUTHORIZED" });
			return;
		}

		// Rotate: revoke old token, issue new pair
		stored.isRevoked = true;
		await stored.save();

		const newAccessToken = signAccessToken(String(user._id), user.roles as UserRole[]);
		const newRefreshToken = await createRefreshToken(String(user._id));

		res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
	},

	async logout(req: Request, res: Response): Promise<void> {
		const { refreshToken } = req.body;

		if (refreshToken) {
			await RefreshToken.updateOne({ token: refreshToken }, { isRevoked: true });
		}

		res.json({ success: true, message: "Logged out" });
	},

	async forgotPassword(req: Request, res: Response): Promise<void> {
		const { phoneNumber } = req.body;
		if (!phoneNumber) {
			res.status(400).json({ success: false, error: "phoneNumber is required" });
			return;
		}

		const user = await User.findOne({ phoneNumber, isDeleted: false });
		if (!user) {
			res.status(404).json({
				success: false,
				error: "No account found with this phone number. Please check the number or create an account.",
				code: "NOT_FOUND",
			});
			return;
		}

		// Invalidate any existing OTPs for this number
		await OTP.deleteMany({ phoneNumber });

		// Generate 6-digit OTP
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

		await OTP.create({ phoneNumber, otp, expiresAt });
		void sendOTP(phoneNumber, otp);

		res.json({ success: true, message: "A verification code has been sent to your WhatsApp." });
	},

	async resetPassword(req: Request, res: Response): Promise<void> {
		const { phoneNumber, otp, newPassword } = req.body;
		if (!phoneNumber || !otp || !newPassword) {
			res.status(400).json({ success: false, error: "phoneNumber, otp and newPassword are required" });
			return;
		}

		if (newPassword.length < 8) {
			res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
			return;
		}

		const record = await OTP.findOne({ phoneNumber, otp, used: false });
		if (!record || record.expiresAt < new Date()) {
			res.status(400).json({ success: false, error: "Invalid or expired OTP", code: "INVALID_OTP" });
			return;
		}

		const user = await User.findOne({ phoneNumber, isDeleted: false });
		if (!user) {
			res.status(404).json({ success: false, error: "User not found" });
			return;
		}

		// Mark OTP used + update password
		record.used = true;
		await record.save();

		const hashed = await bcrypt.hash(newPassword, 12);
		await User.findByIdAndUpdate(user._id, { password: hashed });

		// Revoke all refresh tokens so old sessions are invalidated
		await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

		res.json({ success: true, message: "Password reset successfully. Please log in again." });
	},

	async me(req: Request, res: Response): Promise<void> {
		const user = await User.findById(req.user!._id).select("-password");
		if (!user) {
			res.status(404).json({ success: false, error: "User not found" });
			return;
		}
		res.json({ success: true, user });
	},
};

export default authController;
