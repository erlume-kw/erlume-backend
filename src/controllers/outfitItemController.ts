import { Request, Response } from "express";
import OutfitItem from "../models/OutfitItem";
import Outfit from "../models/Outfit";
import Item from "../models/Item";
import mongoose from "mongoose";

const getOutfitItems = async (req: Request, res: Response): Promise<void> => {
	try {
		const outfitItems = await OutfitItem.find({})
			.populate("outfit_id")
			.populate("item_id");
		res.status(200).json({
			success: true,
			data: outfitItems,
			count: outfitItems.length,
		});
	} catch (error) {
		console.error("Error in getOutfitItems:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getOutfitItemsByOutfitId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const outfitId = req.params.outfitId;

		if (!mongoose.Types.ObjectId.isValid(outfitId)) {
			res.status(400).json({ success: false, error: "Invalid outfit ID" });
			return;
		}

		const outfit = await Outfit.findById(outfitId);
		if (!outfit) {
			res.status(404).json({ success: false, error: "Outfit not found" });
			return;
		}

		const outfitItems = await OutfitItem.find({ outfit_id: outfitId })
			.populate("outfit_id")
			.populate("item_id");

		res.status(200).json({
			success: true,
			data: outfitItems,
			count: outfitItems.length,
		});
	} catch (error) {
		console.error("Error in getOutfitItemsByOutfitId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getOutfitItemById = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const outfitItemId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(outfitItemId)) {
			res.status(400).json({ success: false, error: "Invalid outfit item ID" });
			return;
		}

		const outfitItem = await OutfitItem.findById(outfitItemId)
			.populate("outfit_id")
			.populate("item_id");

		if (!outfitItem) {
			res.status(404).json({ success: false, error: "Outfit item not found" });
			return;
		}

		res.status(200).json({ success: true, data: outfitItem });
	} catch (error) {
		console.error("Error in getOutfitItemById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createOutfitItem = async (req: Request, res: Response): Promise<void> => {
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
		if (!mongoose.Types.ObjectId.isValid(outfit_id)) {
			res.status(400).json({ success: false, error: "Invalid outfit_id" });
			return;
		}

		const outfit = await Outfit.findById(outfit_id);
		if (!outfit) {
			res.status(404).json({ success: false, error: "Outfit not found" });
			return;
		}

		// Validate item_id
		if (!mongoose.Types.ObjectId.isValid(item_id)) {
			res.status(400).json({ success: false, error: "Invalid item_id" });
			return;
		}

		const item = await Item.findById(item_id);
		if (!item) {
			res.status(404).json({ success: false, error: "Item not found" });
			return;
		}

		// Create outfit item
		const newOutfitItem = new OutfitItem({
			item_id,
			outfit_id,
			featured_in_product: featured_in_product || false,
		});

		const savedOutfitItem = await newOutfitItem.save();

		// Add item ID to outfit's item_ids array if not already present
		if (!outfit.item_ids.includes(item_id)) {
			outfit.item_ids.push(item_id);
			await outfit.save();
		}

		res.status(201).json({
			success: true,
			message: "Outfit item created successfully",
			data: savedOutfitItem,
		});
	} catch (error: any) {
		console.error("Error in createOutfitItem:", error);

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

const updateOutfitItem = async (req: Request, res: Response): Promise<void> => {
	try {
		const outfitItemId = req.params.id;
		const updateData = { ...req.body };

		if (!mongoose.Types.ObjectId.isValid(outfitItemId)) {
			res.status(400).json({ success: false, error: "Invalid outfit item ID" });
			return;
		}

		const existingOutfitItem = await OutfitItem.findById(outfitItemId);
		if (!existingOutfitItem) {
			res.status(404).json({ success: false, error: "Outfit item not found" });
			return;
		}

		// Validate outfit_id if provided
		if (updateData.outfit_id) {
			if (!mongoose.Types.ObjectId.isValid(updateData.outfit_id)) {
				res.status(400).json({ success: false, error: "Invalid outfit_id" });
				return;
			}

			const outfit = await Outfit.findById(updateData.outfit_id);
			if (!outfit) {
				res.status(404).json({ success: false, error: "Outfit not found" });
				return;
			}
		}

		// Validate item_id if provided
		if (updateData.item_id) {
			if (!mongoose.Types.ObjectId.isValid(updateData.item_id)) {
				res.status(400).json({ success: false, error: "Invalid item_id" });
				return;
			}

			const item = await Item.findById(updateData.item_id);
			if (!item) {
				res.status(404).json({ success: false, error: "Item not found" });
				return;
			}
		}

		const updatedOutfitItem = await OutfitItem.findByIdAndUpdate(
			outfitItemId,
			updateData,
			{ new: true, runValidators: true },
		);

		if (!updatedOutfitItem) {
			res.status(404).json({ success: false, error: "Outfit item not found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: "Outfit item updated successfully",
			data: updatedOutfitItem,
		});
	} catch (error: any) {
		console.error("Error in updateOutfitItem:", error);

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

const deleteOutfitItem = async (req: Request, res: Response): Promise<void> => {
	try {
		const outfitItemId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(outfitItemId)) {
			res.status(400).json({ success: false, error: "Invalid outfit item ID" });
			return;
		}

		const outfitItem = await OutfitItem.findById(outfitItemId);
		if (!outfitItem) {
			res.status(404).json({ success: false, error: "Outfit item not found" });
			return;
		}

		// Remove item ID from outfit's item_ids array
		await Outfit.updateMany(
			{ item_ids: outfitItem.item_id },
			{ $pull: { item_ids: outfitItem.item_id } },
		);

		// Delete outfit item
		await OutfitItem.findByIdAndDelete(outfitItemId);

		res.status(200).json({
			success: true,
			message: "Outfit item deleted successfully",
			data: { id: outfitItemId },
		});
	} catch (error) {
		console.error("Error in deleteOutfitItem:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const toggleFeaturedItem = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const outfitItemId = req.params.id;
		const { featured } = req.body;

		if (!mongoose.Types.ObjectId.isValid(outfitItemId)) {
			res.status(400).json({ success: false, error: "Invalid outfit item ID" });
			return;
		}

		const outfitItem = await OutfitItem.findById(outfitItemId);
		if (!outfitItem) {
			res.status(404).json({ success: false, error: "Outfit item not found" });
			return;
		}

		const featuredValue =
			featured !== undefined ? featured : !outfitItem.featured_in_product;

		const updatedOutfitItem = await OutfitItem.findByIdAndUpdate(
			outfitItemId,
			{ featured_in_product: featuredValue },
			{ new: true },
		);

		res.status(200).json({
			success: true,
			message: `Outfit item featured status set to: ${featuredValue}`,
			data: updatedOutfitItem,
		});
	} catch (error) {
		console.error("Error in toggleFeaturedItem:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getOutfitItems,
	getOutfitItemsByOutfitId,
	getOutfitItemById,
	createOutfitItem,
	updateOutfitItem,
	deleteOutfitItem,
	toggleFeaturedItem,
};
