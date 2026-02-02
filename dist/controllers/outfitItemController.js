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
const OutfitItem_1 = __importDefault(require("../models/OutfitItem"));
const Outfit_1 = __importDefault(require("../models/Outfit"));
const Item_1 = __importDefault(require("../models/Item"));
const mongoose_1 = __importDefault(require("mongoose"));
const getOutfitItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfitItems = yield OutfitItem_1.default.find({})
            .populate("outfit_id")
            .populate("item_id");
        res.status(200).json({
            success: true,
            data: outfitItems,
            count: outfitItems.length,
        });
    }
    catch (error) {
        console.error("Error in getOutfitItems:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getOutfitItemsByOutfitId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfitId = req.params.outfitId;
        if (!mongoose_1.default.Types.ObjectId.isValid(outfitId)) {
            res.status(400).json({ success: false, error: "Invalid outfit ID" });
            return;
        }
        const outfit = yield Outfit_1.default.findById(outfitId);
        if (!outfit) {
            res.status(404).json({ success: false, error: "Outfit not found" });
            return;
        }
        const outfitItems = yield OutfitItem_1.default.find({ outfit_id: outfitId })
            .populate("outfit_id")
            .populate("item_id");
        res.status(200).json({
            success: true,
            data: outfitItems,
            count: outfitItems.length,
        });
    }
    catch (error) {
        console.error("Error in getOutfitItemsByOutfitId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getOutfitItemById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfitItemId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(outfitItemId)) {
            res.status(400).json({ success: false, error: "Invalid outfit item ID" });
            return;
        }
        const outfitItem = yield OutfitItem_1.default.findById(outfitItemId)
            .populate("outfit_id")
            .populate("item_id");
        if (!outfitItem) {
            res.status(404).json({ success: false, error: "Outfit item not found" });
            return;
        }
        res.status(200).json({ success: true, data: outfitItem });
    }
    catch (error) {
        console.error("Error in getOutfitItemById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createOutfitItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { item_id, outfit_id, featured_in_product } = req.body;
        // Validate required fields
        if (!item_id || !outfit_id) {
            res.status(400).json({
                success: false,
                error: "Missing required fields: item_id, outfit_id",
            });
            return;
        }
        // Validate outfit_id
        if (!mongoose_1.default.Types.ObjectId.isValid(outfit_id)) {
            res.status(400).json({ success: false, error: "Invalid outfit_id" });
            return;
        }
        const outfit = yield Outfit_1.default.findById(outfit_id);
        if (!outfit) {
            res.status(404).json({ success: false, error: "Outfit not found" });
            return;
        }
        // Validate item_id
        if (!mongoose_1.default.Types.ObjectId.isValid(item_id)) {
            res.status(400).json({ success: false, error: "Invalid item_id" });
            return;
        }
        const item = yield Item_1.default.findById(item_id);
        if (!item) {
            res.status(404).json({ success: false, error: "Item not found" });
            return;
        }
        // Create outfit item
        const newOutfitItem = new OutfitItem_1.default({
            item_id,
            outfit_id,
            featured_in_product: featured_in_product || false,
        });
        const savedOutfitItem = yield newOutfitItem.save();
        // Add item ID to outfit's item_ids array if not already present
        if (!outfit.item_ids.includes(item_id)) {
            outfit.item_ids.push(item_id);
            yield outfit.save();
        }
        res.status(201).json({
            success: true,
            message: "Outfit item created successfully",
            data: savedOutfitItem,
        });
    }
    catch (error) {
        console.error("Error in createOutfitItem:", error);
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
const updateOutfitItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfitItemId = req.params.id;
        const updateData = Object.assign({}, req.body);
        if (!mongoose_1.default.Types.ObjectId.isValid(outfitItemId)) {
            res.status(400).json({ success: false, error: "Invalid outfit item ID" });
            return;
        }
        const existingOutfitItem = yield OutfitItem_1.default.findById(outfitItemId);
        if (!existingOutfitItem) {
            res.status(404).json({ success: false, error: "Outfit item not found" });
            return;
        }
        // Validate outfit_id if provided
        if (updateData.outfit_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(updateData.outfit_id)) {
                res.status(400).json({ success: false, error: "Invalid outfit_id" });
                return;
            }
            const outfit = yield Outfit_1.default.findById(updateData.outfit_id);
            if (!outfit) {
                res.status(404).json({ success: false, error: "Outfit not found" });
                return;
            }
        }
        // Validate item_id if provided
        if (updateData.item_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(updateData.item_id)) {
                res.status(400).json({ success: false, error: "Invalid item_id" });
                return;
            }
            const item = yield Item_1.default.findById(updateData.item_id);
            if (!item) {
                res.status(404).json({ success: false, error: "Item not found" });
                return;
            }
        }
        const updatedOutfitItem = yield OutfitItem_1.default.findByIdAndUpdate(outfitItemId, updateData, { new: true, runValidators: true });
        if (!updatedOutfitItem) {
            res.status(404).json({ success: false, error: "Outfit item not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Outfit item updated successfully",
            data: updatedOutfitItem,
        });
    }
    catch (error) {
        console.error("Error in updateOutfitItem:", error);
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
const deleteOutfitItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfitItemId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(outfitItemId)) {
            res.status(400).json({ success: false, error: "Invalid outfit item ID" });
            return;
        }
        const outfitItem = yield OutfitItem_1.default.findById(outfitItemId);
        if (!outfitItem) {
            res.status(404).json({ success: false, error: "Outfit item not found" });
            return;
        }
        // Remove item ID from outfit's item_ids array
        yield Outfit_1.default.updateMany({ item_ids: outfitItem.item_id }, { $pull: { item_ids: outfitItem.item_id } });
        // Delete outfit item
        yield OutfitItem_1.default.findByIdAndDelete(outfitItemId);
        res.status(200).json({
            success: true,
            message: "Outfit item deleted successfully",
            data: { id: outfitItemId },
        });
    }
    catch (error) {
        console.error("Error in deleteOutfitItem:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const toggleFeaturedItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const outfitItemId = req.params.id;
        const { featured } = req.body;
        if (!mongoose_1.default.Types.ObjectId.isValid(outfitItemId)) {
            res.status(400).json({ success: false, error: "Invalid outfit item ID" });
            return;
        }
        const outfitItem = yield OutfitItem_1.default.findById(outfitItemId);
        if (!outfitItem) {
            res.status(404).json({ success: false, error: "Outfit item not found" });
            return;
        }
        const featuredValue = featured !== undefined ? featured : !outfitItem.featured_in_product;
        const updatedOutfitItem = yield OutfitItem_1.default.findByIdAndUpdate(outfitItemId, { featured_in_product: featuredValue }, { new: true });
        res.status(200).json({
            success: true,
            message: `Outfit item featured status set to: ${featuredValue}`,
            data: updatedOutfitItem,
        });
    }
    catch (error) {
        console.error("Error in toggleFeaturedItem:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getOutfitItems,
    getOutfitItemsByOutfitId,
    getOutfitItemById,
    createOutfitItem,
    updateOutfitItem,
    deleteOutfitItem,
    toggleFeaturedItem,
};
