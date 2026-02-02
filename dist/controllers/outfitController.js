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
const Outfit_1 = __importDefault(require("../models/Outfit"));
const Item_1 = __importDefault(require("../models/Item"));
const mongoose_1 = __importDefault(require("mongoose"));
const getOutfits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfits = yield Outfit_1.default.find({})
            .populate("item_ids")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: outfits,
            count: outfits.length,
        });
    }
    catch (error) {
        console.error("Error in getOutfits:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getOutfitById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfitId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(outfitId)) {
            res.status(400).json({ success: false, error: "Invalid outfit ID" });
            return;
        }
        const outfit = yield Outfit_1.default.findById(outfitId).populate("item_ids");
        if (!outfit) {
            res.status(404).json({ success: false, error: "Outfit not found" });
            return;
        }
        res.status(200).json({ success: true, data: outfit });
    }
    catch (error) {
        console.error("Error in getOutfitById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createOutfit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { item_ids, outfit_title, outfit_tags } = req.body;
        // Validate required fields
        if (!item_ids || !outfit_title || !outfit_tags) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: item_ids, outfit_title, outfit_tags",
            });
            return;
        }
        // Validate item_ids is an array
        if (!Array.isArray(item_ids) || item_ids.length === 0) {
            res.status(400).json({
                success: false,
                error: "item_ids must be a non-empty array",
            });
            return;
        }
        // Validate all item IDs
        for (const itemId of item_ids) {
            if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid item_id: ${itemId}`,
                });
                return;
            }
            const item = yield Item_1.default.findById(itemId);
            if (!item) {
                res.status(404).json({
                    success: false,
                    error: `Item not found: ${itemId}`,
                });
                return;
            }
        }
        // Create outfit
        const newOutfit = new Outfit_1.default({
            item_ids,
            outfit_title,
            outfit_tags,
        });
        const savedOutfit = yield newOutfit.save();
        res.status(201).json({
            success: true,
            message: "Outfit created successfully",
            data: savedOutfit,
        });
    }
    catch (error) {
        console.error("Error in createOutfit:", error);
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
const updateOutfit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfitId = req.params.id;
        const updateData = Object.assign({}, req.body);
        if (!mongoose_1.default.Types.ObjectId.isValid(outfitId)) {
            res.status(400).json({ success: false, error: "Invalid outfit ID" });
            return;
        }
        const existingOutfit = yield Outfit_1.default.findById(outfitId);
        if (!existingOutfit) {
            res.status(404).json({ success: false, error: "Outfit not found" });
            return;
        }
        // Validate item_ids if provided
        if (updateData.item_ids !== undefined) {
            if (!Array.isArray(updateData.item_ids) ||
                updateData.item_ids.length === 0) {
                res.status(400).json({
                    success: false,
                    error: "item_ids must be a non-empty array",
                });
                return;
            }
            for (const itemId of updateData.item_ids) {
                if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
                    res.status(400).json({
                        success: false,
                        error: `Invalid item_id: ${itemId}`,
                    });
                    return;
                }
                const item = yield Item_1.default.findById(itemId);
                if (!item) {
                    res.status(404).json({
                        success: false,
                        error: `Item not found: ${itemId}`,
                    });
                    return;
                }
            }
        }
        const updatedOutfit = yield Outfit_1.default.findByIdAndUpdate(outfitId, updateData, {
            new: true,
            runValidators: true,
        });
        if (!updatedOutfit) {
            res.status(404).json({ success: false, error: "Outfit not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Outfit updated successfully",
            data: updatedOutfit,
        });
    }
    catch (error) {
        console.error("Error in updateOutfit:", error);
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
const deleteOutfit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfitId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(outfitId)) {
            res.status(400).json({ success: false, error: "Invalid outfit ID" });
            return;
        }
        const outfit = yield Outfit_1.default.findById(outfitId);
        if (!outfit) {
            res.status(404).json({ success: false, error: "Outfit not found" });
            return;
        }
        // Delete outfit (cascade delete will handle OutfitItems)
        yield Outfit_1.default.findByIdAndDelete(outfitId);
        res.status(200).json({
            success: true,
            message: "Outfit deleted successfully",
            data: { id: outfitId },
        });
    }
    catch (error) {
        console.error("Error in deleteOutfit:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getOutfits,
    getOutfitById,
    createOutfit,
    updateOutfit,
    deleteOutfit,
};
