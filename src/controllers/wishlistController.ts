// src/controllers/wishlistController.ts

import { Request, Response } from "express";
import mongoose from "mongoose";
import Wishlist from "../models/Wishlist";
import Item from "../models/Item";
import User from "../models/User";
import { assertSelfOrAdmin } from "../utils/rls";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/* ─── GET /api/wishlist/:userId ───────────────────────────────────────────── */

const getWishlist = async (req: Request, res: Response): Promise<void> => {
	try {
		const { userId } = req.params;

		if (!isValidId(userId)) {
			res.status(400).json({ success: false, error: "Invalid user ID" });
			return;
		}

		if (!assertSelfOrAdmin(req, res, userId)) return;

		// Return wishlist with full item details populated
		const wishlist = await Wishlist.findOne({ user_id: userId })
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
			data: { ...wishlist, count: wishlist.item_ids.length },
		});
	} catch (error) {
		console.error("Error in getWishlist:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── POST /api/wishlist/:userId/items  { item_id } ──────────────────────── */

const addToWishlist = async (req: Request, res: Response): Promise<void> => {
	try {
		const { userId } = req.params;
		const { item_id } = req.body;

		if (!isValidId(userId)) {
			res.status(400).json({ success: false, error: "Invalid user ID" });
			return;
		}

		if (!assertSelfOrAdmin(req, res, userId)) return;

		if (!item_id || !isValidId(item_id)) {
			res.status(400).json({ success: false, error: "Invalid item_id" });
			return;
		}

		// Confirm user exists
		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ success: false, error: "User not found" });
			return;
		}

		// Confirm item exists
		const item = await Item.findById(item_id);
		if (!item) {
			res.status(404).json({ success: false, error: "Item not found" });
			return;
		}

		// Upsert: create wishlist if it doesn't exist, then add item (no duplicates)
		const wishlist = await Wishlist.findOneAndUpdate(
			{ user_id: userId },
			{ $addToSet: { item_ids: item_id } },
			{ new: true, upsert: true },
		).populate("item_ids");

		res.status(200).json({
			success: true,
			message: "Item added to wishlist",
			data: { ...wishlist.toObject(), count: wishlist.item_ids.length },
		});
	} catch (error) {
		console.error("Error in addToWishlist:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── DELETE /api/wishlist/:userId/items/:itemId ─────────────────────────── */

const removeFromWishlist = async (req: Request, res: Response): Promise<void> => {
	try {
		const { userId, itemId } = req.params;

		if (!isValidId(userId)) {
			res.status(400).json({ success: false, error: "Invalid user ID" });
			return;
		}

		if (!assertSelfOrAdmin(req, res, userId)) return;

		if (!isValidId(itemId)) {
			res.status(400).json({ success: false, error: "Invalid item ID" });
			return;
		}

		const wishlist = await Wishlist.findOneAndUpdate(
			{ user_id: userId },
			{ $pull: { item_ids: itemId } },
			{ new: true },
		).populate("item_ids");

		if (!wishlist) {
			res.status(404).json({ success: false, error: "Wishlist not found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: "Item removed from wishlist",
			data: { ...wishlist.toObject(), count: wishlist.item_ids.length },
		});
	} catch (error) {
		console.error("Error in removeFromWishlist:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── DELETE /api/wishlist/:userId  (clear entire wishlist) ──────────────── */

const clearWishlist = async (req: Request, res: Response): Promise<void> => {
	try {
		const { userId } = req.params;

		if (!isValidId(userId)) {
			res.status(400).json({ success: false, error: "Invalid user ID" });
			return;
		}

		if (!assertSelfOrAdmin(req, res, userId)) return;

		await Wishlist.findOneAndUpdate(
			{ user_id: userId },
			{ $set: { item_ids: [] } },
			{ new: true },
		);

		res.status(200).json({ success: true, message: "Wishlist cleared" });
	} catch (error) {
		console.error("Error in clearWishlist:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
