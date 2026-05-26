"use strict";
// src/controllers/shippingController.ts
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
const ShippingMethod_1 = __importDefault(require("../models/ShippingMethod"));
const kuwaitEnums_1 = require("../enums/kuwaitEnums");
/* ─── GET /api/shipping ───────────────────────────────────────────────────── */
// Public — returns all active shipping methods
const getShippingMethods = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const methods = yield ShippingMethod_1.default.find({ isActive: true }).lean();
        res.status(200).json({ success: true, data: methods, count: methods.length });
    }
    catch (error) {
        console.error("Error in getShippingMethods:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── GET /api/shipping/zone/:governorate ─────────────────────────────────── */
// Public — returns methods available for a specific Kuwait governorate.
// A method applies if its zones array is empty (all zones) or contains the governorate.
const getShippingByZone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { governorate } = req.params;
        if (!Object.values(kuwaitEnums_1.KuwaitGovernorate).includes(governorate)) {
            res.status(400).json({
                success: false,
                error: `Invalid governorate. Must be one of: ${Object.values(kuwaitEnums_1.KuwaitGovernorate).join(", ")}`,
            });
            return;
        }
        const methods = yield ShippingMethod_1.default.find({
            isActive: true,
            $or: [
                { zones: { $size: 0 } }, // empty = all zones
                { zones: governorate }, // or explicitly includes this zone
            ],
        }).lean();
        res.status(200).json({ success: true, data: methods, count: methods.length });
    }
    catch (error) {
        console.error("Error in getShippingByZone:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── GET /api/shipping/:id ───────────────────────────────────────────────── */
const getShippingMethodById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, error: "Invalid shipping method ID" });
            return;
        }
        const method = yield ShippingMethod_1.default.findById(id).lean();
        if (!method) {
            res.status(404).json({ success: false, error: "Shipping method not found" });
            return;
        }
        res.status(200).json({ success: true, data: method });
    }
    catch (error) {
        console.error("Error in getShippingMethodById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── POST /api/shipping ──────────────────────────────────────────────────── */
// Admin only
const createShippingMethod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, price, zones, isActive } = req.body;
        if (!name || price === undefined || price === null) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: name, price",
            });
            return;
        }
        if (typeof price !== "number" || price < 0) {
            res.status(400).json({ success: false, error: "price must be a non-negative number" });
            return;
        }
        // Validate zones if provided
        if (zones && Array.isArray(zones)) {
            const validGovernates = Object.values(kuwaitEnums_1.KuwaitGovernorate);
            const invalid = zones.filter((z) => !validGovernates.includes(z));
            if (invalid.length > 0) {
                res.status(400).json({
                    success: false,
                    error: `Invalid zones: ${invalid.join(", ")}. Must be Kuwait governorates.`,
                });
                return;
            }
        }
        const method = yield ShippingMethod_1.default.create({
            name,
            description,
            price,
            zones: zones !== null && zones !== void 0 ? zones : [],
            isActive: isActive !== null && isActive !== void 0 ? isActive : true,
        });
        res.status(201).json({
            success: true,
            message: "Shipping method created",
            data: method,
        });
    }
    catch (error) {
        console.error("Error in createShippingMethod:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((e) => e.message);
            res.status(400).json({ success: false, error: "Validation error", details: errors });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── PUT /api/shipping/:id ───────────────────────────────────────────────── */
// Admin only
const updateShippingMethod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const update = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, error: "Invalid shipping method ID" });
            return;
        }
        if (update.price !== undefined && (typeof update.price !== "number" || update.price < 0)) {
            res.status(400).json({ success: false, error: "price must be a non-negative number" });
            return;
        }
        if (update.zones && Array.isArray(update.zones)) {
            const validGovernates = Object.values(kuwaitEnums_1.KuwaitGovernorate);
            const invalid = update.zones.filter((z) => !validGovernates.includes(z));
            if (invalid.length > 0) {
                res.status(400).json({
                    success: false,
                    error: `Invalid zones: ${invalid.join(", ")}`,
                });
                return;
            }
        }
        const method = yield ShippingMethod_1.default.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });
        if (!method) {
            res.status(404).json({ success: false, error: "Shipping method not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Shipping method updated", data: method });
    }
    catch (error) {
        console.error("Error in updateShippingMethod:", error);
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((e) => e.message);
            res.status(400).json({ success: false, error: "Validation error", details: errors });
            return;
        }
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── DELETE /api/shipping/:id ────────────────────────────────────────────── */
// Admin only
const deleteShippingMethod = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, error: "Invalid shipping method ID" });
            return;
        }
        const method = yield ShippingMethod_1.default.findByIdAndDelete(id);
        if (!method) {
            res.status(404).json({ success: false, error: "Shipping method not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Shipping method deleted" });
    }
    catch (error) {
        console.error("Error in deleteShippingMethod:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getShippingMethods,
    getShippingByZone,
    getShippingMethodById,
    createShippingMethod,
    updateShippingMethod,
    deleteShippingMethod,
};
