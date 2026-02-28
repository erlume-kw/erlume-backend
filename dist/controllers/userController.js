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
const User_1 = __importDefault(require("../models/User"));
const Seller_1 = __importDefault(require("../models/Seller"));
const userEnums_1 = require("../enums/userEnums");
const flowEnums_1 = require("../enums/flowEnums");
/* =========================
   Helpers
========================= */
const formatSellerResponse = (seller) => {
    // Always include these fields, even if they don't exist in the document
    const response = Object.assign({}, seller);
    // Handle consentGiven - always include it explicitly
    // Check if it exists and is true, otherwise set to empty string
    if (seller.consentGiven === true ||
        seller.consentGiven === "true" ||
        seller.consentGiven === 1) {
        response.consentGiven = "true";
    }
    else {
        // Always set to empty string if false, undefined, null, or missing
        response.consentGiven = "";
    }
    // Handle preferredPickupDate - always include it explicitly
    if (seller.preferredPickupDate &&
        seller.preferredPickupDate !== null &&
        seller.preferredPickupDate !== undefined &&
        String(seller.preferredPickupDate).trim() !== "") {
        response.preferredPickupDate = String(seller.preferredPickupDate);
    }
    else {
        // Always set to empty string if missing, null, undefined, or empty
        response.preferredPickupDate = "";
    }
    return response;
};
const createSeller = (userId, data, session) => __awaiter(void 0, void 0, void 0, function* () {
    const sellerData = {
        userId,
        balance: "0",
        itemIds: [],
        IBAN: "",
        qrCode: "",
        isDeactivated: false,
        consentGiven: (data === null || data === void 0 ? void 0 : data.consentGiven) !== undefined ? data.consentGiven : false,
        preferredPickupDate: (data === null || data === void 0 ? void 0 : data.preferredPickupDate) !== undefined ? data.preferredPickupDate : "",
    };
    const [sellerDoc] = yield Seller_1.default.create([sellerData], { session });
    // Explicitly mark fields as modified to ensure they're saved
    sellerDoc.markModified("consentGiven");
    sellerDoc.markModified("preferredPickupDate");
    return [sellerDoc];
});
/* =========================
   GET USERS
========================= */
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { includeDeleted, role } = req.query;
    // Build query - include deleted users if requested
    const query = {};
    // Only filter by isDeleted if includeDeleted is not explicitly "true"
    if (includeDeleted === "true") {
        // Include all users (deleted and non-deleted) - no filter
    }
    else {
        // Default: only show non-deleted users
        query.isDeleted = false;
    }
    if (role) {
        query.roles = role;
    }
    console.log("getUsers query:", query, "includeDeleted:", includeDeleted);
    const users = yield User_1.default.find(query).lean();
    const result = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
        if (!user.roles.includes(userEnums_1.UserRole.SELLER))
            return user;
        const seller = yield Seller_1.default.findOne({ userId: user._id }).lean();
        return Object.assign(Object.assign({}, user), { seller: seller ? formatSellerResponse(seller) : null });
    })));
    res.json({
        success: true,
        data: result,
        count: result.length,
        includeDeleted: includeDeleted === "true",
    });
});
/* =========================
   GET USER BY ID
========================= */
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
    }
    const user = yield User_1.default.findById(id).lean();
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    let seller = null;
    if (user.roles.includes(userEnums_1.UserRole.SELLER)) {
        const sellerDoc = yield Seller_1.default.findOne({ userId: user._id }).lean();
        if (sellerDoc)
            seller = formatSellerResponse(sellerDoc);
    }
    res.json({ success: true, data: { user, seller } });
});
/* =========================
   CREATE USER
========================= */
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { password, emailAddress, phoneNumber, address, roles, consentGiven, preferredPickupDate, } = req.body;
        if (!password || !emailAddress || !phoneNumber || !address) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: password, emailAddress, phoneNumber, address",
            });
            return;
        }
        // Normalize roles to lowercase so "SELLER" / "seller" both work
        const normalizedRoles = Array.isArray(roles)
            ? roles.map((r) => (typeof r === "string" ? r.toLowerCase() : r))
            : [userEnums_1.UserRole.USER];
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield User_1.default.create([
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
        ], { session });
        let seller = null;
        if (normalizedRoles.includes(userEnums_1.UserRole.SELLER)) {
            // Handle consentGiven properly - only true if explicitly true or "true"
            let consentBool = false;
            if (consentGiven !== undefined && consentGiven !== null) {
                if (typeof consentGiven === "string") {
                    consentBool = consentGiven.toLowerCase() === "true";
                }
                else if (typeof consentGiven === "boolean") {
                    consentBool = consentGiven;
                }
                else {
                    consentBool = consentGiven === true;
                }
            }
            const [sellerDoc] = yield createSeller(user[0]._id, {
                consentGiven: consentBool,
                preferredPickupDate: preferredPickupDate !== null && preferredPickupDate !== void 0 ? preferredPickupDate : "",
            }, session);
            seller = formatSellerResponse(sellerDoc.toObject());
        }
        yield session.commitTransaction();
        res.status(201).json({
            success: true,
            data: {
                user: user[0],
                seller,
            },
        });
    }
    catch (err) {
        yield session.abortTransaction();
        console.error("createUser error:", err);
        const message = (err === null || err === void 0 ? void 0 : err.message) ||
            ((_b = (_a = err === null || err === void 0 ? void 0 : err.errors) === null || _a === void 0 ? void 0 : _a.phoneNumber) === null || _b === void 0 ? void 0 : _b.message) ||
            ((_d = (_c = err === null || err === void 0 ? void 0 : err.errors) === null || _c === void 0 ? void 0 : _c.emailAddress) === null || _d === void 0 ? void 0 : _d.message) ||
            ((_f = (_e = err === null || err === void 0 ? void 0 : err.errors) === null || _e === void 0 ? void 0 : _e.address) === null || _f === void 0 ? void 0 : _f.message) ||
            "Internal server error";
        const status = (err === null || err === void 0 ? void 0 : err.name) === "ValidationError" || (err === null || err === void 0 ? void 0 : err.code) === 11000 ? 400 : 500;
        res.status(status).json(Object.assign({ success: false, error: message }, ((err === null || err === void 0 ? void 0 : err.errors) && { details: err.errors })));
    }
    finally {
        session.endSession();
    }
});
/* =========================
   UPDATE USER
========================= */
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
    }
    const update = Object.assign({}, req.body);
    delete update.roles;
    if (update.password) {
        update.password = yield bcryptjs_1.default.hash(update.password, 10);
    }
    const user = yield User_1.default.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
    });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    let seller = null;
    if (user.roles.includes(userEnums_1.UserRole.SELLER)) {
        const sellerDoc = yield Seller_1.default.findOne({ userId: user._id }).lean();
        if (sellerDoc)
            seller = formatSellerResponse(sellerDoc);
    }
    res.json({ success: true, data: { user, seller } });
});
/* =========================
   UPDATE SELLER (PATCH SAFE)
========================= */
const updateSellerInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid ID" });
        return;
    }
    const user = yield User_1.default.findById(id);
    if (!user || !user.roles.includes(userEnums_1.UserRole.SELLER)) {
        res.status(404).json({ error: "Seller not found" });
        return;
    }
    const update = {};
    if ("consentGiven" in req.body) {
        const consentValue = req.body.consentGiven;
        if (typeof consentValue === "string") {
            update.consentGiven = consentValue.toLowerCase() === "true";
        }
        else if (typeof consentValue === "boolean") {
            update.consentGiven = consentValue;
        }
        else {
            // Only set to true if explicitly true, otherwise false
            update.consentGiven = consentValue === true;
        }
    }
    if ("preferredPickupDate" in req.body) {
        update.preferredPickupDate = (_a = req.body.preferredPickupDate) !== null && _a !== void 0 ? _a : "";
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
        if (val != null &&
            val !== "" &&
            !Object.values(flowEnums_1.EscalationStatus).includes(val)) {
            res.status(400).json({
                error: `Invalid escalationStatus. Must be one of: ${Object.values(flowEnums_1.EscalationStatus).join(", ")}`,
            });
            return;
        }
        update.escalationStatus = val == null || val === "" ? undefined : val;
    }
    if ("escalationNotes" in req.body) {
        update.escalationNotes = (_b = req.body.escalationNotes) !== null && _b !== void 0 ? _b : "";
    }
    const seller = yield Seller_1.default.findOneAndUpdate({ userId: user._id }, { $set: update }, { new: true, upsert: true, runValidators: true });
    res.json({
        success: true,
        data: formatSellerResponse(seller.toObject()),
    });
});
/* =========================
   DELETE USER (SOFT)
========================= */
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const user = yield User_1.default.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    if (user.roles.includes(userEnums_1.UserRole.SELLER)) {
        yield Seller_1.default.updateOne({ userId: user._id }, { isDeactivated: true });
    }
    res.json({ success: true });
});
/* =========================
   UPDATE ROLES
========================= */
const updateUserRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { roles } = req.body;
    const user = yield User_1.default.findByIdAndUpdate(id, { roles }, { new: true, runValidators: true });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    if (roles.includes(userEnums_1.UserRole.SELLER)) {
        yield Seller_1.default.findOneAndUpdate({ userId: user._id }, {}, { upsert: true });
    }
    res.json({ success: true, data: user });
});
/* =========================
   EXPORT
========================= */
exports.default = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateSellerInfo,
    updateUserRoles,
};
