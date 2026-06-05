"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const OTP_1 = __importDefault(require("../models/OTP"));
const userEnums_1 = require("../enums/userEnums");
const notifications_1 = require("../utils/notifications");
const ACCESS_SECRET = process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_SECRET = (process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
const REFRESH_EXPIRES_DAYS = 30;
// ─── Token helpers ────────────────────────────────────────────────────────────
function signAccessToken(userId, roles) {
    return jsonwebtoken_1.default.sign({ _id: userId, roles }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}
function createRefreshToken(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Opaque random token (not JWT) — harder to decode, easy to revoke
        const token = crypto_1.default.randomBytes(64).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);
        yield RefreshToken_1.default.create({ token, userId, expiresAt });
        return token;
    });
}
// ─── Controller ───────────────────────────────────────────────────────────────
const authController = {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { password, emailAddress, phoneNumber, address, roles } = req.body;
            const existing = yield User_1.default.findOne({ emailAddress, isDeleted: false });
            if (existing) {
                res.status(409).json({ success: false, error: "Email already in use", code: "DUPLICATE_KEY" });
                return;
            }
            const hashed = yield bcryptjs_1.default.hash(password, 12);
            const user = yield User_1.default.create({
                password: hashed,
                emailAddress,
                phoneNumber,
                address,
                roles: roles !== null && roles !== void 0 ? roles : [userEnums_1.UserRole.USER],
            });
            const accessToken = signAccessToken(String(user._id), user.roles);
            const refreshToken = yield createRefreshToken(String(user._id));
            res.status(201).json({
                success: true,
                accessToken,
                refreshToken,
                user: { _id: user._id, emailAddress: user.emailAddress, roles: user.roles },
            });
        });
    },
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { emailAddress, password } = req.body;
            const user = yield User_1.default.findOne({ emailAddress, isDeleted: false }).select("+password");
            if (!user) {
                res.status(401).json({ success: false, error: "Invalid credentials", code: "UNAUTHORIZED" });
                return;
            }
            const valid = yield bcryptjs_1.default.compare(password, user.password);
            if (!valid) {
                res.status(401).json({ success: false, error: "Invalid credentials", code: "UNAUTHORIZED" });
                return;
            }
            const accessToken = signAccessToken(String(user._id), user.roles);
            const refreshToken = yield createRefreshToken(String(user._id));
            res.json({
                success: true,
                accessToken,
                refreshToken,
                user: { _id: user._id, emailAddress: user.emailAddress, roles: user.roles },
            });
        });
    },
    refresh(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(401).json({ success: false, error: "Refresh token required" });
                return;
            }
            const stored = yield RefreshToken_1.default.findOne({ token: refreshToken });
            if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
                res.status(401).json({ success: false, error: "Invalid or expired refresh token", code: "UNAUTHORIZED" });
                return;
            }
            const user = yield User_1.default.findById(stored.userId).select("_id roles");
            if (!user) {
                res.status(401).json({ success: false, error: "User not found", code: "UNAUTHORIZED" });
                return;
            }
            // Rotate: revoke old token, issue new pair
            stored.isRevoked = true;
            yield stored.save();
            const newAccessToken = signAccessToken(String(user._id), user.roles);
            const newRefreshToken = yield createRefreshToken(String(user._id));
            res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
        });
    },
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = req.body;
            if (refreshToken) {
                yield RefreshToken_1.default.updateOne({ token: refreshToken }, { isRevoked: true });
            }
            res.json({ success: true, message: "Logged out" });
        });
    },
    forgotPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                res.status(400).json({ success: false, error: "phoneNumber is required" });
                return;
            }
            const user = yield User_1.default.findOne({ phoneNumber, isDeleted: false });
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: "No account found with this phone number. Please check the number or create an account.",
                    code: "NOT_FOUND",
                });
                return;
            }
            // Invalidate any existing OTPs for this number
            yield OTP_1.default.deleteMany({ phoneNumber });
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            yield OTP_1.default.create({ phoneNumber, otp, expiresAt });
            void (0, notifications_1.sendOTP)(phoneNumber, otp);
            res.json({ success: true, message: "A verification code has been sent to your WhatsApp." });
        });
    },
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { phoneNumber, otp, newPassword } = req.body;
            if (!phoneNumber || !otp || !newPassword) {
                res.status(400).json({ success: false, error: "phoneNumber, otp and newPassword are required" });
                return;
            }
            if (newPassword.length < 8) {
                res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
                return;
            }
            const record = yield OTP_1.default.findOne({ phoneNumber, otp, used: false });
            if (!record || record.expiresAt < new Date()) {
                res.status(400).json({ success: false, error: "Invalid or expired OTP", code: "INVALID_OTP" });
                return;
            }
            const user = yield User_1.default.findOne({ phoneNumber, isDeleted: false });
            if (!user) {
                res.status(404).json({ success: false, error: "User not found" });
                return;
            }
            // Mark OTP used + update password
            record.used = true;
            yield record.save();
            const hashed = yield bcryptjs_1.default.hash(newPassword, 12);
            yield User_1.default.findByIdAndUpdate(user._id, { password: hashed });
            // Revoke all refresh tokens so old sessions are invalidated
            yield RefreshToken_1.default.updateMany({ userId: user._id }, { isRevoked: true });
            res.json({ success: true, message: "Password reset successfully. Please log in again." });
        });
    },
    me(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findById(req.user._id).select("-password");
            if (!user) {
                res.status(404).json({ success: false, error: "User not found" });
                return;
            }
            res.json({ success: true, user });
        });
    },
};
exports.default = authController;
