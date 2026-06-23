"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Seller_1 = __importDefault(require("../models/Seller"));
const User_1 = __importDefault(require("../models/User"));
const userEnums_1 = require("../enums/userEnums");
const getSellers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const includeDeactivated = req.query.includeDeactivated === "true";
        const filter = includeDeactivated ? {} : { isDeactivated: false };
        const sellers = yield Seller_1.default.find(filter).lean();
        res
            .status(200)
            .json({ success: true, data: sellers, count: sellers.length });
    }
    catch (error) {
        console.error("Error in getSellers:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getSellerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, error: "Invalid seller ID" });
            return;
        }
        // Accept either Seller _id or userId (user id)
        let seller = yield Seller_1.default.findById(id).lean();
        if (!seller) {
            seller = yield Seller_1.default.findOne({ userId: id }).lean();
        }
        if (!seller) {
            res.status(404).json({ success: false, error: "Seller not found" });
            return;
        }
        res.status(200).json({ success: true, data: seller });
    }
    catch (error) {
        console.error("Error in getSellerById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createSeller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { password, emailAddress, phoneNumber, address, consentGiven, preferredPickupDate, fullName, addressText, intakeTimestamp, } = req.body;
        if (!password || !emailAddress || !phoneNumber || !address) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: password, emailAddress, phoneNumber, address",
            });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield User_1.default.create([
            {
                password: hashedPassword,
                emailAddress,
                phoneNumber,
                address,
                roles: [userEnums_1.UserRole.SELLER],
                isDeleted: false,
            },
        ], { session });
        const normalizeConsent = (value) => {
            if (typeof value === "string") {
                const normalized = value.trim().toLowerCase();
                if (normalized === "true" ||
                    normalized === "yes" ||
                    normalized === "y" ||
                    normalized === "نعم" ||
                    normalized === "yes / نعم") {
                    return true;
                }
                if (normalized === "false" ||
                    normalized === "no" ||
                    normalized === "n" ||
                    normalized === "لا" ||
                    normalized === "no / لا") {
                    return false;
                }
            }
            return value === true;
        };
        const sellerData = {
            userId: user[0]._id,
            fullName: fullName !== null && fullName !== void 0 ? fullName : "",
            emailAddress,
            phoneNumber,
            addressText: addressText !== null && addressText !== void 0 ? addressText : "",
            balance: "0",
            itemIds: [],
            IBAN: "",
            qrCode: "",
            isDeactivated: false,
            consentGiven: normalizeConsent(consentGiven),
            preferredPickupDate: preferredPickupDate !== undefined ? preferredPickupDate : "",
            intakeTimestamp,
        };
        const [sellerDoc] = yield Seller_1.default.create([sellerData], { session });
        sellerDoc.markModified("consentGiven");
        sellerDoc.markModified("preferredPickupDate");
        yield session.commitTransaction();
        res.status(201).json({
            success: true,
            data: { user: user[0], seller: sellerDoc },
        });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Error in createSeller:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
    finally {
        session.endSession();
    }
});
const registerFromForm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { fullName, emailAddress, phoneNumber, preferredPickupAddress, consent } = req.body;
        if (!fullName || !phoneNumber) {
            res.status(400).json({ success: false, error: "fullName and phoneNumber are required" });
            return;
        }
        // Reject if T&C not accepted
        const normalizeConsent = (v) => {
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
            const existing = yield User_1.default.findOne({ emailAddress, isDeleted: false });
            if (existing) {
                res.status(409).json({ success: false, error: "A seller with this email already exists" });
                return;
            }
        }
        // Generate a random temp password — not shared with seller, team sets it later
        const tempPassword = yield bcryptjs_1.default.hash(Math.random().toString(36).slice(2) + Date.now(), 10);
        const [user] = yield User_1.default.create([{
                password: tempPassword,
                emailAddress: emailAddress !== null && emailAddress !== void 0 ? emailAddress : `form-${Date.now()}@erlume.placeholder`,
                phoneNumber,
                roles: [userEnums_1.UserRole.SELLER],
                isDeleted: false,
                address: {
                    street: preferredPickupAddress !== null && preferredPickupAddress !== void 0 ? preferredPickupAddress : "TBD",
                    city: "Kuwait",
                    block: "TBD",
                    governorate: "Kuwait",
                    house: "TBD",
                },
            }], { session });
        const [seller] = yield Seller_1.default.create([{
                userId: user._id,
                fullName: fullName !== null && fullName !== void 0 ? fullName : "",
                emailAddress: emailAddress !== null && emailAddress !== void 0 ? emailAddress : "",
                phoneNumber,
                addressText: preferredPickupAddress !== null && preferredPickupAddress !== void 0 ? preferredPickupAddress : "",
                balance: "0",
                consentGiven: true,
                sellerPolicyAcceptedAt: new Date(),
                onboardingStatus: "initial_contact",
                isDeactivated: false,
            }], { session });
        yield session.commitTransaction();
        // Notify info@erlume.com.kw
        try {
            const { Resend } = yield Promise.resolve().then(() => __importStar(require("resend")));
            const resend = new Resend(process.env.RESEND_API_KEY);
            yield resend.emails.send({
                from: (_a = process.env.RESEND_FROM) !== null && _a !== void 0 ? _a : "orders@erlume.com.kw",
                to: ["info@erlume.com.kw"],
                subject: `New seller registration — ${fullName}`,
                html: `
					<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
						<h2 style="color:#111d11;margin:0 0 20px;">New Seller Registered</h2>
						<table style="width:100%;border-collapse:collapse;font-size:14px;">
							<tr><td style="padding:8px 0;color:#666;width:140px;">Name</td><td style="padding:8px 0;font-weight:600;">${fullName}</td></tr>
							<tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${phoneNumber}</td></tr>
							<tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;">${emailAddress !== null && emailAddress !== void 0 ? emailAddress : "—"}</td></tr>
							<tr><td style="padding:8px 0;color:#666;">Pickup Address</td><td style="padding:8px 0;">${preferredPickupAddress !== null && preferredPickupAddress !== void 0 ? preferredPickupAddress : "—"}</td></tr>
							<tr><td style="padding:8px 0;color:#666;">T&C Accepted</td><td style="padding:8px 0;">✅ Yes</td></tr>
							<tr><td style="padding:8px 0;color:#666;">Seller ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px;">${String(seller._id)}</td></tr>
						</table>
						<div style="margin-top:28px;">
							<a href="${(_b = process.env.BACKOFFICE_URL) !== null && _b !== void 0 ? _b : "http://localhost:5173"}/sellers/${String(seller._id)}" style="background:#111d11;color:#fff;padding:11px 24px;border-radius:5px;text-decoration:none;font-size:13px;">Complete Profile in Backoffice</a>
						</div>
						<p style="margin-top:24px;font-size:12px;color:#aaa;">Submitted via Google Form · ${new Date().toLocaleString("en-KW", { timeZone: "Asia/Kuwait" })}</p>
					</div>`,
            });
        }
        catch (emailErr) {
            console.error("[registerFromForm] Notification email failed:", emailErr);
        }
        res.status(201).json({
            success: true,
            sellerId: String(seller._id),
            message: "Seller registered. Erlume team notified to complete the profile.",
        });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Error in registerFromForm:", error);
        if (error.code === 11000) {
            res.status(409).json({ success: false, error: "A seller with this email already exists" });
        }
        else {
            res.status(500).json({ success: false, error: "Internal server error" });
        }
    }
    finally {
        session.endSession();
    }
});
const deleteSeller = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, error: "Invalid seller ID" });
            return;
        }
        // Resolve to userId: id may be Seller._id or userId
        let userId = null;
        const sellerById = yield Seller_1.default.findById(id);
        if (sellerById) {
            userId = sellerById.userId;
        }
        else {
            const sellerByUserId = yield Seller_1.default.findOne({ userId: id });
            if (sellerByUserId)
                userId = sellerByUserId.userId;
            else
                userId = new mongoose_1.default.Types.ObjectId(id);
        }
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, error: "Seller/User not found" });
            return;
        }
        if (!user.roles.includes(userEnums_1.UserRole.SELLER)) {
            res.status(404).json({ success: false, error: "User is not a seller" });
            return;
        }
        yield User_1.default.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
        yield Seller_1.default.updateOne({ userId }, { isDeactivated: true });
        res.status(200).json({
            success: true,
            message: "Seller deactivated and user soft-deleted",
        });
    }
    catch (error) {
        console.error("Error in deleteSeller:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getSellers,
    getSellerById,
    createSeller,
    registerFromForm,
    deleteSeller,
};
