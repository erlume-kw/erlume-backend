"use strict";
// src/controllers/wishlistController.ts
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
const Wishlist_1 = __importDefault(require("../models/Wishlist"));
const Item_1 = __importDefault(require("../models/Item"));
const User_1 = __importDefault(require("../models/User"));
const rls_1 = require("../utils/rls");
/* ─── helpers ─────────────────────────────────────────────────────────────── */
const isValidId = (id) => mongoose_1.default.Types.ObjectId.isValid(id);
/* ─── GET /api/wishlist/:userId ───────────────────────────────────────────── */
const getWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!isValidId(userId)) {
            res.status(400).json({ success: false, error: "Invalid user ID" });
            return;
        }
        if (!(0, rls_1.assertSelfOrAdmin)(req, res, userId))
            return;
        // Return wishlist with full item details populated
        const wishlist = yield Wishlist_1.default.findOne({ user_id: userId })
            .populate("item_ids")
            .lean();
        // If no wishlist exists yet, return an empty one
        if (!wishlist) {
            res.status(200).json({
                success: true,
                data: { user_id: userId, item_ids: [], count: 0 },
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: Object.assign(Object.assign({}, wishlist), { count: wishlist.item_ids.length }),
        });
    }
    catch (error) {
        console.error("Error in getWishlist:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── POST /api/wishlist/:userId/items  { item_id } ──────────────────────── */
const addToWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { item_id } = req.body;
        if (!isValidId(userId)) {
            res.status(400).json({ success: false, error: "Invalid user ID" });
            return;
        }
        if (!(0, rls_1.assertSelfOrAdmin)(req, res, userId))
            return;
        if (!item_id || !isValidId(item_id)) {
            res.status(400).json({ success: false, error: "Invalid item_id" });
            return;
        }
        // Confirm user exists
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, error: "User not found" });
            return;
        }
        // Confirm item exists
        const item = yield Item_1.default.findById(item_id);
        if (!item) {
            res.status(404).json({ success: false, error: "Item not found" });
            return;
        }
        // Upsert: create wishlist if it doesn't exist, then add item (no duplicates)
        const wishlist = yield Wishlist_1.default.findOneAndUpdate({ user_id: userId }, { $addToSet: { item_ids: item_id } }, { new: true, upsert: true }).populate("item_ids");
        res.status(200).json({
            success: true,
            message: "Item added to wishlist",
            data: Object.assign(Object.assign({}, wishlist.toObject()), { count: wishlist.item_ids.length }),
        });
    }
    catch (error) {
        console.error("Error in addToWishlist:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── DELETE /api/wishlist/:userId/items/:itemId ─────────────────────────── */
const removeFromWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, itemId } = req.params;
        if (!isValidId(userId)) {
            res.status(400).json({ success: false, error: "Invalid user ID" });
            return;
        }
        if (!(0, rls_1.assertSelfOrAdmin)(req, res, userId))
            return;
        if (!isValidId(itemId)) {
            res.status(400).json({ success: false, error: "Invalid item ID" });
            return;
        }
        const wishlist = yield Wishlist_1.default.findOneAndUpdate({ user_id: userId }, { $pull: { item_ids: itemId } }, { new: true }).populate("item_ids");
        if (!wishlist) {
            res.status(404).json({ success: false, error: "Wishlist not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Item removed from wishlist",
            data: Object.assign(Object.assign({}, wishlist.toObject()), { count: wishlist.item_ids.length }),
        });
    }
    catch (error) {
        console.error("Error in removeFromWishlist:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
/* ─── DELETE /api/wishlist/:userId  (clear entire wishlist) ──────────────── */
const clearWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!isValidId(userId)) {
            res.status(400).json({ success: false, error: "Invalid user ID" });
            return;
        }
        if (!(0, rls_1.assertSelfOrAdmin)(req, res, userId))
            return;
        yield Wishlist_1.default.findOneAndUpdate({ user_id: userId }, { $set: { item_ids: [] } }, { new: true });
        res.status(200).json({ success: true, message: "Wishlist cleared" });
    }
    catch (error) {
        console.error("Error in clearWishlist:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
