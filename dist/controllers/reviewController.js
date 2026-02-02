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
const Review_1 = __importDefault(require("../models/Review"));
const Seller_1 = __importDefault(require("../models/Seller"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const reviewEnums_1 = require("../enums/reviewEnums");
const getReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reviews = yield Review_1.default.find({})
            .populate("userId")
            .populate("sellerId");
        res.status(200).json({
            success: true,
            data: reviews,
            count: reviews.length,
        });
    }
    catch (error) {
        console.error("Error in getReviews:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getReviewsByProductId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = req.params.productId;
        // Note: This assumes productId refers to sellerId
        // If you have a different product model, adjust accordingly
        if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
            res.status(400).json({ success: false, error: "Invalid product ID" });
            return;
        }
        const reviews = yield Review_1.default.find({ sellerId: productId })
            .populate("userId")
            .populate("sellerId");
        res.status(200).json({
            success: true,
            data: reviews,
            count: reviews.length,
        });
    }
    catch (error) {
        console.error("Error in getReviewsByProductId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getReviewsBySellerId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sellerId = req.params.userId; // Note: param is userId but refers to seller
        if (!mongoose_1.default.Types.ObjectId.isValid(sellerId)) {
            res.status(400).json({ success: false, error: "Invalid seller ID" });
            return;
        }
        const seller = yield Seller_1.default.findById(sellerId);
        if (!seller) {
            res.status(404).json({ success: false, error: "Seller not found" });
            return;
        }
        const reviews = yield Review_1.default.find({ sellerId })
            .populate("userId")
            .populate("sellerId");
        res.status(200).json({
            success: true,
            data: reviews,
            count: reviews.length,
        });
    }
    catch (error) {
        console.error("Error in getReviewsBySellerId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getReviewById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reviewId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
            res.status(400).json({ success: false, error: "Invalid review ID" });
            return;
        }
        const review = yield Review_1.default.findById(reviewId)
            .populate("userId")
            .populate("sellerId");
        if (!review) {
            res.status(404).json({ success: false, error: "Review not found" });
            return;
        }
        res.status(200).json({ success: true, data: review });
    }
    catch (error) {
        console.error("Error in getReviewById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, sellerId, rating, description } = req.body;
        // Validate required fields
        if (!sellerId || !rating || !description) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: sellerId, rating, description",
            });
            return;
        }
        // Validate sellerId
        if (!mongoose_1.default.Types.ObjectId.isValid(sellerId)) {
            res.status(400).json({ success: false, error: "Invalid seller ID" });
            return;
        }
        const seller = yield Seller_1.default.findById(sellerId);
        if (!seller) {
            res.status(404).json({ success: false, error: "Seller not found" });
            return;
        }
        // Validate userId if provided
        if (userId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                res.status(400).json({ success: false, error: "Invalid user ID" });
                return;
            }
            const user = yield User_1.default.findById(userId);
            if (!user) {
                res.status(404).json({ success: false, error: "User not found" });
                return;
            }
        }
        // Validate rating enum
        if (!Object.values(reviewEnums_1.Stars).includes(rating)) {
            res.status(400).json({
                success: false,
                error: `Invalid rating. Must be one of: ${Object.values(reviewEnums_1.Stars).join(", ")}`,
            });
            return;
        }
        // Create review
        const newReview = new Review_1.default({
            userId,
            sellerId,
            rating,
            description,
        });
        const savedReview = yield newReview.save();
        res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: savedReview,
        });
    }
    catch (error) {
        console.error("Error in createReview:", error);
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
const updateReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reviewId = req.params.id;
        const updateData = Object.assign({}, req.body);
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
            res.status(400).json({ success: false, error: "Invalid review ID" });
            return;
        }
        const existingReview = yield Review_1.default.findById(reviewId);
        if (!existingReview) {
            res.status(404).json({ success: false, error: "Review not found" });
            return;
        }
        // Validate rating if provided
        if (updateData.rating &&
            !Object.values(reviewEnums_1.Stars).includes(updateData.rating)) {
            res.status(400).json({
                success: false,
                error: `Invalid rating. Must be one of: ${Object.values(reviewEnums_1.Stars).join(", ")}`,
            });
            return;
        }
        // Validate sellerId if provided
        if (updateData.sellerId) {
            if (!mongoose_1.default.Types.ObjectId.isValid(updateData.sellerId)) {
                res.status(400).json({ success: false, error: "Invalid seller ID" });
                return;
            }
            const seller = yield Seller_1.default.findById(updateData.sellerId);
            if (!seller) {
                res.status(404).json({ success: false, error: "Seller not found" });
                return;
            }
        }
        // Validate userId if provided
        if (updateData.userId !== undefined) {
            if (updateData.userId === null || updateData.userId === "") {
                updateData.userId = undefined; // Allow clearing userId
            }
            else {
                if (!mongoose_1.default.Types.ObjectId.isValid(updateData.userId)) {
                    res.status(400).json({ success: false, error: "Invalid user ID" });
                    return;
                }
                const user = yield User_1.default.findById(updateData.userId);
                if (!user) {
                    res.status(404).json({ success: false, error: "User not found" });
                    return;
                }
            }
        }
        const updatedReview = yield Review_1.default.findByIdAndUpdate(reviewId, updateData, {
            new: true,
            runValidators: true,
        });
        if (!updatedReview) {
            res.status(404).json({ success: false, error: "Review not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: updatedReview,
        });
    }
    catch (error) {
        console.error("Error in updateReview:", error);
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
const deleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reviewId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
            res.status(400).json({ success: false, error: "Invalid review ID" });
            return;
        }
        const review = yield Review_1.default.findById(reviewId);
        if (!review) {
            res.status(404).json({ success: false, error: "Review not found" });
            return;
        }
        yield Review_1.default.findByIdAndDelete(reviewId);
        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            data: { id: reviewId },
        });
    }
    catch (error) {
        console.error("Error in deleteReview:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getReviews,
    getReviewsByProductId,
    getReviewsBySellerId,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
};
