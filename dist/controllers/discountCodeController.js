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
const DiscountCode_1 = __importDefault(require("../models/DiscountCode"));
const mongoose_1 = __importDefault(require("mongoose"));
const getDiscountCodes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { is_active } = req.query;
        const query = {};
        if (is_active !== undefined) {
            query.is_active = is_active === "true";
        }
        const discountCodes = yield DiscountCode_1.default.find(query).sort({
            createdAt: -1,
        });
        res.status(200).json({
            success: true,
            data: discountCodes,
            count: discountCodes.length,
        });
    }
    catch (error) {
        console.error("Error in getDiscountCodes:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getDiscountCodeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const discountId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(discountId)) {
            res
                .status(400)
                .json({ success: false, error: "Invalid discount code ID" });
            return;
        }
        const discountCode = yield DiscountCode_1.default.findById(discountId);
        if (!discountCode) {
            res
                .status(404)
                .json({ success: false, error: "Discount code not found" });
            return;
        }
        res.status(200).json({ success: true, data: discountCode });
    }
    catch (error) {
        console.error("Error in getDiscountCodeById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getDiscountCodeByCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const code = req.params.code;
        if (!code || code.trim() === "") {
            res.status(400).json({
                success: false,
                error: "Discount code is required",
            });
            return;
        }
        const discountCode = yield DiscountCode_1.default.findOne({
            code: { $regex: new RegExp(`^${code}$`, "i") },
        });
        if (!discountCode) {
            res
                .status(404)
                .json({ success: false, error: "Discount code not found" });
            return;
        }
        res.status(200).json({ success: true, data: discountCode });
    }
    catch (error) {
        console.error("Error in getDiscountCodeByCode:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createDiscountCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, discount_percentage, expiry_date, is_active } = req.body;
        // Validate required fields
        if (!code || !discount_percentage || !expiry_date) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: code, discount_percentage, expiry_date",
            });
            return;
        }
        // Check if discount code already exists (case-insensitive)
        const existingCode = yield DiscountCode_1.default.findOne({
            code: { $regex: new RegExp(`^${code}$`, "i") },
        });
        if (existingCode) {
            res.status(400).json({
                success: false,
                error: "Discount code already exists",
            });
            return;
        }
        // Validate discount_percentage is a valid number
        const percentage = parseFloat(discount_percentage);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            res.status(400).json({
                success: false,
                error: "discount_percentage must be a number between 0 and 100",
            });
            return;
        }
        // Validate expiry_date is a valid date
        const expiryDateObj = new Date(expiry_date);
        if (isNaN(expiryDateObj.getTime())) {
            res.status(400).json({
                success: false,
                error: "Invalid expiry_date format",
            });
            return;
        }
        // Create discount code
        const newDiscountCode = new DiscountCode_1.default({
            code: code.toUpperCase(), // Store in uppercase
            discount_percentage,
            expiry_date: expiryDateObj,
            is_active: is_active !== undefined ? is_active : true, // Default to true
        });
        const savedDiscountCode = yield newDiscountCode.save();
        res.status(201).json({
            success: true,
            message: "Discount code created successfully",
            data: savedDiscountCode,
        });
    }
    catch (error) {
        console.error("Error in createDiscountCode:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: errors,
            });
            return;
        }
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: "Discount code already exists",
            });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const updateDiscountCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const discountId = req.params.id;
        const updateData = Object.assign({}, req.body);
        if (!mongoose_1.default.Types.ObjectId.isValid(discountId)) {
            res
                .status(400)
                .json({ success: false, error: "Invalid discount code ID" });
            return;
        }
        const existingDiscount = yield DiscountCode_1.default.findById(discountId);
        if (!existingDiscount) {
            res
                .status(404)
                .json({ success: false, error: "Discount code not found" });
            return;
        }
        // Check if discount code already exists (if updating code)
        if (updateData.code) {
            const existingCode = yield DiscountCode_1.default.findOne({
                code: { $regex: new RegExp(`^${updateData.code}$`, "i") },
                _id: { $ne: discountId },
            });
            if (existingCode) {
                res.status(400).json({
                    success: false,
                    error: "Discount code already exists",
                });
                return;
            }
            updateData.code = updateData.code.toUpperCase();
        }
        // Validate discount_percentage if provided
        if (updateData.discount_percentage) {
            const percentage = parseFloat(updateData.discount_percentage);
            if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                res.status(400).json({
                    success: false,
                    error: "discount_percentage must be a number between 0 and 100",
                });
                return;
            }
        }
        // Validate expiry_date if provided
        if (updateData.expiry_date) {
            const expiryDateObj = new Date(updateData.expiry_date);
            if (isNaN(expiryDateObj.getTime())) {
                res.status(400).json({
                    success: false,
                    error: "Invalid expiry_date format",
                });
                return;
            }
            updateData.expiry_date = expiryDateObj;
        }
        const updatedDiscount = yield DiscountCode_1.default.findByIdAndUpdate(discountId, updateData, { new: true, runValidators: true });
        if (!updatedDiscount) {
            res
                .status(404)
                .json({ success: false, error: "Discount code not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Discount code updated successfully",
            data: updatedDiscount,
        });
    }
    catch (error) {
        console.error("Error in updateDiscountCode:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: errors,
            });
            return;
        }
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: "Discount code already exists",
            });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const deleteDiscountCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const discountId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(discountId)) {
            res
                .status(400)
                .json({ success: false, error: "Invalid discount code ID" });
            return;
        }
        const discountCode = yield DiscountCode_1.default.findById(discountId);
        if (!discountCode) {
            res
                .status(404)
                .json({ success: false, error: "Discount code not found" });
            return;
        }
        yield DiscountCode_1.default.findByIdAndDelete(discountId);
        res.status(200).json({
            success: true,
            message: "Discount code deleted successfully",
            data: { id: discountId },
        });
    }
    catch (error) {
        console.error("Error in deleteDiscountCode:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const validateDiscountCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, orderTotal } = req.body;
        if (!code || code.trim() === "") {
            res.status(400).json({
                success: false,
                error: "Discount code is required",
            });
            return;
        }
        const discountCode = yield DiscountCode_1.default.findOne({
            code: { $regex: new RegExp(`^${code}$`, "i") },
        });
        if (!discountCode) {
            res.status(404).json({
                success: false,
                error: "Discount code not found",
                code: "DISCOUNT_NOT_FOUND",
                valid: false,
            });
            return;
        }
        // Check if code has expired first (more specific than inactive)
        const now = new Date();
        if (discountCode.expiry_date < now) {
            res.status(400).json({
                success: false,
                error: "Discount code has expired",
                code: "DISCOUNT_EXPIRED",
                valid: false,
            });
            return;
        }
        // Check if code is active
        if (!discountCode.is_active) {
            res.status(400).json({
                success: false,
                error: "Discount code is not active",
                code: "DISCOUNT_INACTIVE",
                valid: false,
            });
            return;
        }
        // Calculate discount amounts if orderTotal provided
        const percentage = parseFloat(discountCode.discount_percentage);
        let discountAmount;
        let finalTotal;
        if (orderTotal !== undefined) {
            const total = parseFloat(String(orderTotal));
            if (!isNaN(total) && total >= 0) {
                const discount = (total * percentage) / 100;
                discountAmount = discount.toFixed(3);
                finalTotal = Math.max(0, total - discount).toFixed(3);
            }
        }
        res.status(200).json(Object.assign(Object.assign(Object.assign({ success: true, valid: true, discountPercentage: percentage }, (discountAmount !== undefined && { discountAmount })), (finalTotal !== undefined && { finalTotal })), { data: {
                _id: discountCode._id,
                code: discountCode.code,
                discount_percentage: discountCode.discount_percentage,
                expiry_date: discountCode.expiry_date,
            } }));
    }
    catch (error) {
        console.error("Error in validateDiscountCode:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getDiscountCodes,
    getDiscountCodeById,
    getDiscountCodeByCode,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,
    validateDiscountCode,
};
