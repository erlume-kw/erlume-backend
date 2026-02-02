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
    deleteSeller,
};
