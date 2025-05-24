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
const User_1 = __importDefault(require("../models/User"));
const Seller_1 = __importDefault(require("../models/Seller"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userEnums_1 = require("../enums/userEnums");
// Helper function to create a seller document
const createSellerDocument = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const seller = new Seller_1.default({
        userId,
        balance: "0", // Initial balance
        itemIds: [], // Initial empty items list
        IBAN: "", // Will be updated later by the seller
        qrCode: "", // Will be generated when IBAN is provided
        isDeactivated: false
    });
    return seller; // Return the document without saving it
});
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.find({ isDeleted: false });
        res.status(200).json({ success: true, data: users });
    }
    catch (error) {
        console.error('Error in getUsers:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const user = yield User_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // If user is a seller, fetch seller information
        let sellerInfo = null;
        if (user.roles.includes(userEnums_1.UserRole.SELLER)) {
            sellerInfo = yield Seller_1.default.findOne({ userId: user._id });
        }
        res.status(200).json({
            success: true,
            data: {
                user,
                seller: sellerInfo
            }
        });
    }
    catch (error) {
        console.error('Error in getUserById:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { username, password, emailAddress, phoneNumber, address, roles } = req.body;
        // Hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = new User_1.default({
            username,
            password: hashedPassword,
            emailAddress,
            phoneNumber,
            address,
            roles: roles || [userEnums_1.UserRole.USER], // Default role is 'user'
            cardIds: [],
            isDeleted: false
        });
        const savedUser = yield user.save({ session });
        // If user has seller role, create seller document
        let sellerDoc = null;
        if (roles && roles.includes(userEnums_1.UserRole.SELLER)) {
            sellerDoc = yield createSellerDocument(savedUser._id);
            yield sellerDoc.save({ session });
        }
        yield session.commitTransaction();
        res.status(201).json({
            success: true,
            data: {
                user: savedUser,
                seller: sellerDoc
            }
        });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error('Error in createUser:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Username or email already exists'
            });
        }
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
    finally {
        session.endSession();
    }
});
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const userId = req.params.id;
        const updateData = req.body;
        // Don't allow direct role updates through this endpoint
        delete updateData.roles;
        const user = yield User_1.default.findOneAndUpdate({ _id: userId, isDeleted: false }, updateData, { new: true, session });
        if (!user) {
            yield session.abortTransaction();
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        yield session.commitTransaction();
        res.status(200).json({ success: true, data: user });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error('Error in updateUser:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
    finally {
        session.endSession();
    }
});
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const userId = req.params.id;
        // Soft delete the user
        const user = yield User_1.default.findOneAndUpdate({ _id: userId, isDeleted: false }, { isDeleted: true }, { new: true, session });
        if (!user) {
            yield session.abortTransaction();
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // If user is a seller, deactivate seller account
        if (user.roles.includes(userEnums_1.UserRole.SELLER)) {
            yield Seller_1.default.findOneAndUpdate({ userId: user._id }, { isDeactivated: true }, { session });
        }
        yield session.commitTransaction();
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error('Error in deleteUser:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
    finally {
        session.endSession();
    }
});
const updateSellerInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const userId = req.params.id;
        const { IBAN } = req.body;
        // Verify user exists and is a seller
        const user = yield User_1.default.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            yield session.abortTransaction();
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        if (!user.roles.includes(userEnums_1.UserRole.SELLER)) {
            yield session.abortTransaction();
            return res.status(403).json({ success: false, error: 'User is not a seller' });
        }
        // Update seller information
        const seller = yield Seller_1.default.findOneAndUpdate({ userId: user._id }, {
            IBAN,
            qrCode: `QR_${IBAN}` // Generate QR code based on IBAN (implement proper QR generation)
        }, { new: true, session });
        if (!seller) {
            yield session.abortTransaction();
            return res.status(404).json({ success: false, error: 'Seller information not found' });
        }
        yield session.commitTransaction();
        res.status(200).json({ success: true, data: seller });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error('Error in updateSellerInfo:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
    finally {
        session.endSession();
    }
});
exports.default = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateSellerInfo
};
