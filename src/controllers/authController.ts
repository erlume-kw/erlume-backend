// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { UserRole } from "../enums/userEnums";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(userId: string, roles: UserRole[]): string {
	return jwt.sign({ _id: userId, roles }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

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

		const token = signToken(String(user._id), user.roles as UserRole[]);
		res.status(201).json({ success: true, token, user: { _id: user._id, emailAddress: user.emailAddress, roles: user.roles } });
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

		const token = signToken(String(user._id), user.roles as UserRole[]);
		res.json({ success: true, token, user: { _id: user._id, emailAddress: user.emailAddress, roles: user.roles } });
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
