import { Request, Response } from "express";
import Outfit from "../models/Outfit";
import OutfitItem from "../models/OutfitItem";
import Item from "../models/Item";
import mongoose from "mongoose";

const getOutfits = async (req: Request, res: Response): Promise<void> => {
	try {
		const outfits = await Outfit.find({})
			.populate("item_ids")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			data: outfits,
			count: outfits.length,
		});
	} catch (error) {
		console.error("Error in getOutfits:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getOutfitById = async (req: Request, res: Response): Promise<void> => {
	try {
		const outfitId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(outfitId)) {
			res.status(400).json({ success: false, error: "Invalid outfit ID" });
			return;
		}

		const outfit = await Outfit.findById(outfitId).populate("item_ids");

		if (!outfit) {
			res.status(404).json({ success: false, error: "Outfit not found" });
			return;
		}

		res.status(200).json({ success: true, data: outfit });
	} catch (error) {
		console.error("Error in getOutfitById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createOutfit = async (req: Request, res: Response): Promise<void> => {
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
			if (!mongoose.Types.ObjectId.isValid(itemId)) {
				res.status(400).json({
					success: false,
					error: `Invalid item_id: ${itemId}`,
				});
				return;
			}

			const item = await Item.findById(itemId);
			if (!item) {
				res.status(404).json({
					success: false,
					error: `Item not found: ${itemId}`,
				});
				return;
			}
		}

		// Create outfit
		const newOutfit = new Outfit({
			item_ids,
			outfit_title,
			outfit_tags,
		});

		const savedOutfit = await newOutfit.save();

		res.status(201).json({
			success: true,
			message: "Outfit created successfully",
			data: savedOutfit,
		});
	} catch (error: any) {
		console.error("Error in createOutfit:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const updateOutfit = async (req: Request, res: Response): Promise<void> => {
	try {
		const outfitId = req.params.id;
		const updateData = { ...req.body };

		if (!mongoose.Types.ObjectId.isValid(outfitId)) {
			res.status(400).json({ success: false, error: "Invalid outfit ID" });
			return;
		}

		const existingOutfit = await Outfit.findById(outfitId);
		if (!existingOutfit) {
			res.status(404).json({ success: false, error: "Outfit not found" });
			return;
		}

		// Validate item_ids if provided
		if (updateData.item_ids !== undefined) {
			if (
				!Array.isArray(updateData.item_ids) ||
				updateData.item_ids.length === 0
			) {
				res.status(400).json({
					success: false,
					error: "item_ids must be a non-empty array",
				});
				return;
			}

			for (const itemId of updateData.item_ids) {
				if (!mongoose.Types.ObjectId.isValid(itemId)) {
					res.status(400).json({
						success: false,
						error: `Invalid item_id: ${itemId}`,
					});
					return;
				}

				const item = await Item.findById(itemId);
				if (!item) {
					res.status(404).json({
						success: false,
						error: `Item not found: ${itemId}`,
					});
					return;
				}
			}
		}

		const updatedOutfit = await Outfit.findByIdAndUpdate(outfitId, updateData, {
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
	} catch (error: any) {
		console.error("Error in updateOutfit:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const deleteOutfit = async (req: Request, res: Response): Promise<void> => {
	try {
		const outfitId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(outfitId)) {
			res.status(400).json({ success: false, error: "Invalid outfit ID" });
			return;
		}

		const outfit = await Outfit.findById(outfitId);
		if (!outfit) {
			res.status(404).json({ success: false, error: "Outfit not found" });
			return;
		}

		// Delete outfit (cascade delete will handle OutfitItems)
		await Outfit.findByIdAndDelete(outfitId);

		res.status(200).json({
			success: true,
			message: "Outfit deleted successfully",
			data: { id: outfitId },
		});
	} catch (error) {
		console.error("Error in deleteOutfit:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getOutfits,
	getOutfitById,
	createOutfit,
	updateOutfit,
	deleteOutfit,
};
