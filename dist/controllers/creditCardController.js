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
const CreditCard_1 = __importDefault(require("../models/CreditCard"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const rls_1 = require("../utils/rls");
const getCreditCards = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const creditCards = yield CreditCard_1.default.find({});
        res.status(200).json({
            success: true,
            data: creditCards,
            count: creditCards.length,
        });
    }
    catch (error) {
        console.error("Error in getCreditCards:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getCreditCardsByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({ success: false, error: "Invalid user ID" });
            return;
        }
        if (!(0, rls_1.assertSelfOrAdmin)(req, res, userId))
            return;
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, error: "User not found" });
            return;
        }
        // Get credit cards from user's cardIds array
        const creditCards = yield CreditCard_1.default.find({
            _id: { $in: user.cardIds || [] },
        });
        res.status(200).json({
            success: true,
            data: creditCards,
            count: creditCards.length,
        });
    }
    catch (error) {
        console.error("Error in getCreditCardsByUserId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getCreditCardById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cardId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(cardId)) {
            res.status(400).json({ success: false, error: "Invalid credit card ID" });
            return;
        }
        const creditCard = yield CreditCard_1.default.findById(cardId);
        if (!creditCard) {
            res.status(404).json({ success: false, error: "Credit card not found" });
            return;
        }
        // Verify the card belongs to the requesting user (admins bypass)
        const owner = yield User_1.default.findOne({ cardIds: cardId });
        if (!(0, rls_1.assertSelfOrAdmin)(req, res, String(owner === null || owner === void 0 ? void 0 : owner._id)))
            return;
        // Mask card number for security (show only last 4 digits)
        const maskedCard = Object.assign(Object.assign({}, creditCard.toObject()), { cardNumber: `****-****-****-${creditCard.cardNumber.slice(-4)}` });
        res.status(200).json({ success: true, data: maskedCard });
    }
    catch (error) {
        console.error("Error in getCreditCardById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createCreditCard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cardNumber, expiryDate, holderName, userId } = req.body;
        // Validate required fields
        if (!cardNumber || !expiryDate || !holderName || !userId) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: cardNumber, expiryDate, holderName, userId",
            });
            return;
        }
        // Validate userId
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({ success: false, error: "Invalid user ID" });
            return;
        }
        if (!(0, rls_1.assertSelfOrAdmin)(req, res, userId))
            return;
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, error: "User not found" });
            return;
        }
        // Validate card number format (basic validation)
        const cleanedCardNumber = cardNumber.replace(/\s+/g, "").replace(/-/g, "");
        if (!/^\d{13,19}$/.test(cleanedCardNumber)) {
            res.status(400).json({
                success: false,
                error: "Invalid card number format",
            });
            return;
        }
        // Create credit card
        const newCreditCard = new CreditCard_1.default({
            cardNumber: cleanedCardNumber,
            expiryDate,
            holderName,
        });
        const savedCreditCard = yield newCreditCard.save();
        // Add card ID to user's cardIds array
        if (!user.cardIds) {
            user.cardIds = [];
        }
        user.cardIds.push(savedCreditCard._id);
        yield user.save();
        // Mask card number in response
        const maskedCard = Object.assign(Object.assign({}, savedCreditCard.toObject()), { cardNumber: `****-****-****-${savedCreditCard.cardNumber.slice(-4)}` });
        res.status(201).json({
            success: true,
            message: "Credit card created successfully",
            data: maskedCard,
        });
    }
    catch (error) {
        console.error("Error in createCreditCard:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: errors,
            });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const updateCreditCard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cardId = req.params.id;
        const updateData = Object.assign({}, req.body);
        if (!mongoose_1.default.Types.ObjectId.isValid(cardId)) {
            res.status(400).json({ success: false, error: "Invalid credit card ID" });
            return;
        }
        const existingCard = yield CreditCard_1.default.findById(cardId);
        if (!existingCard) {
            res.status(404).json({ success: false, error: "Credit card not found" });
            return;
        }
        const owner = yield User_1.default.findOne({ cardIds: cardId });
        if (!(0, rls_1.assertSelfOrAdmin)(req, res, String(owner === null || owner === void 0 ? void 0 : owner._id)))
            return;
        // Validate card number format if provided
        if (updateData.cardNumber) {
            const cleanedCardNumber = updateData.cardNumber
                .replace(/\s+/g, "")
                .replace(/-/g, "");
            if (!/^\d{13,19}$/.test(cleanedCardNumber)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid card number format",
                });
                return;
            }
            updateData.cardNumber = cleanedCardNumber;
        }
        const updatedCard = yield CreditCard_1.default.findByIdAndUpdate(cardId, updateData, { new: true, runValidators: true });
        if (!updatedCard) {
            res.status(404).json({ success: false, error: "Credit card not found" });
            return;
        }
        // Mask card number in response
        const maskedCard = Object.assign(Object.assign({}, updatedCard.toObject()), { cardNumber: `****-****-****-${updatedCard.cardNumber.slice(-4)}` });
        res.status(200).json({
            success: true,
            message: "Credit card updated successfully",
            data: maskedCard,
        });
    }
    catch (error) {
        console.error("Error in updateCreditCard:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: errors,
            });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const deleteCreditCard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cardId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(cardId)) {
            res.status(400).json({ success: false, error: "Invalid credit card ID" });
            return;
        }
        const creditCard = yield CreditCard_1.default.findById(cardId);
        if (!creditCard) {
            res.status(404).json({ success: false, error: "Credit card not found" });
            return;
        }
        const owner = yield User_1.default.findOne({ cardIds: cardId });
        if (!(0, rls_1.assertSelfOrAdmin)(req, res, String(owner === null || owner === void 0 ? void 0 : owner._id)))
            return;
        // Remove card ID from all users' cardIds arrays
        yield User_1.default.updateMany({ cardIds: cardId }, { $pull: { cardIds: cardId } });
        // Delete the credit card
        yield CreditCard_1.default.findByIdAndDelete(cardId);
        res.status(200).json({
            success: true,
            message: "Credit card deleted successfully",
            data: { id: cardId },
        });
    }
    catch (error) {
        console.error("Error in deleteCreditCard:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getCreditCards,
    getCreditCardsByUserId,
    getCreditCardById,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
};
