import { Request, Response } from "express";
import Drop from "../models/Drop";
import Item from "../models/Item";
import mongoose, { Types } from "mongoose";
import { DropStatus } from "../enums/dropEnums";
import { ItemStatus } from "../enums/statusEnums";

const getDrops = async (req: Request, res: Response): Promise<void> => {
	try {
		const { status } = req.query;

		// Build query - filter by status if provided
		const query: any = {};
		if (status) {
			if (!Object.values(DropStatus).includes(status as DropStatus)) {
				res.status(400).json({
					success: false,
					error: `Invalid status. Must be one of: ${Object.values(
						DropStatus,
					).join(", ")}`,
				});
				return;
			}
			query.status = status;
		}

		const drops = await Drop.find(query).sort({ releaseDate: -1 }); // Sort by release date, newest first

		res.status(200).json({
			success: true,
			data: drops,
			count: drops.length,
		});
	} catch (error) {
		console.error("Error in getDrops:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getDropById = async (req: Request, res: Response): Promise<void> => {
	try {
		const dropId = req.params.id;

		// Validate drop ID
		if (!mongoose.Types.ObjectId.isValid(dropId)) {
			res.status(400).json({ success: false, error: "Invalid drop ID" });
			return;
		}

		const drop = await Drop.findById(dropId);

		if (!drop) {
			res.status(404).json({ success: false, error: "Drop not found" });
			return;
		}

		// Get item count for this drop
		const itemCount = await Item.countDocuments({ drop_id: dropId });

		res.status(200).json({
			success: true,
			data: {
				...drop.toObject(),
				itemCount,
			},
		});
	} catch (error) {
		console.error("Error in getDropById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createDrop = async (req: Request, res: Response): Promise<void> => {
	try {
		const { name, description, releaseDate, status } = req.body;

		// Validate required fields
		if (!name || !releaseDate) {
			res.status(400).json({
				success: false,
				error: "Missing required fields: name, releaseDate",
			});
			return;
		}

		// Validate status if provided
		if (status && !Object.values(DropStatus).includes(status)) {
			res.status(400).json({
				success: false,
				error: `Invalid status. Must be one of: ${Object.values(
					DropStatus,
				).join(", ")}`,
			});
			return;
		}

		// Validate releaseDate is a valid date
		const releaseDateObj = new Date(releaseDate);
		if (isNaN(releaseDateObj.getTime())) {
			res.status(400).json({
				success: false,
				error: "Invalid releaseDate format",
			});
			return;
		}

		// Create new drop
		const dropStatus = status || DropStatus.Upcoming;
		const newDrop = new Drop({
			name,
			description,
			releaseDate: releaseDateObj,
			status: dropStatus,
		});

		const savedDrop = await newDrop.save();

		// Set item status based on drop status:
		// - "upcoming" → items become "pending"
		// - "active" → items become "available"
		if (dropStatus === DropStatus.Upcoming) {
			await Item.updateMany(
				{ drop_id: savedDrop._id },
				{ $set: { itemStatus: ItemStatus.Pending } },
			);
		} else if (dropStatus === DropStatus.Active) {
			await Item.updateMany(
				{ drop_id: savedDrop._id },
				{ $set: { itemStatus: ItemStatus.Available } },
			);
		}

		res.status(201).json({
			success: true,
			message: "Drop created successfully",
			data: savedDrop,
		});
	} catch (error: any) {
		console.error("Error in createDrop:", error);

		// Handle validation errors
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

const updateDrop = async (req: Request, res: Response): Promise<void> => {
	try {
		const dropId = req.params.id;
		const updateData = { ...req.body };

		// Validate drop ID
		if (!mongoose.Types.ObjectId.isValid(dropId)) {
			res.status(400).json({ success: false, error: "Invalid drop ID" });
			return;
		}

		// Check if drop exists
		const existingDrop = await Drop.findById(dropId);
		if (!existingDrop) {
			res.status(404).json({ success: false, error: "Drop not found" });
			return;
		}

		// Validate status if provided
		if (
			updateData.status &&
			!Object.values(DropStatus).includes(updateData.status)
		) {
			res.status(400).json({
				success: false,
				error: `Invalid status. Must be one of: ${Object.values(
					DropStatus,
				).join(", ")}`,
			});
			return;
		}

		// Validate releaseDate if provided
		if (updateData.releaseDate) {
			const releaseDateObj = new Date(updateData.releaseDate);
			if (isNaN(releaseDateObj.getTime())) {
				res.status(400).json({
					success: false,
					error: "Invalid releaseDate format",
				});
				return;
			}
			updateData.releaseDate = releaseDateObj;
		}

		// Update drop
		const updatedDrop = await Drop.findByIdAndUpdate(dropId, updateData, {
			new: true,
			runValidators: true,
		});

		if (!updatedDrop) {
			res.status(404).json({ success: false, error: "Drop not found" });
			return;
		}

		// Set item status based on drop status:
		// - "upcoming" → items become "pending"
		// - "active" → items become "available"
		if (updateData.status === DropStatus.Upcoming) {
			const updateResult = await Item.updateMany(
				{ drop_id: dropId },
				{ $set: { itemStatus: ItemStatus.Pending } },
			);
			console.log(
				`Updated ${updateResult.modifiedCount} item(s) to Pending status for drop ${dropId} (status: upcoming)`,
			);
		} else if (updateData.status === DropStatus.Active) {
			const updateResult = await Item.updateMany(
				{ drop_id: dropId },
				{ $set: { itemStatus: ItemStatus.Available } },
			);
			console.log(
				`Updated ${updateResult.modifiedCount} item(s) to Available status for drop ${dropId} (status: active)`,
			);
		}

		res.status(200).json({
			success: true,
			message: "Drop updated successfully",
			data: updatedDrop,
		});
	} catch (error: any) {
		console.error("Error in updateDrop:", error);

		// Handle validation errors
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

const deleteDrop = async (req: Request, res: Response): Promise<void> => {
	try {
		const dropId = req.params.id;
		const { removeItems } = req.query; // Optional: removeItems=true to also remove items from drop

		// Validate drop ID
		if (!mongoose.Types.ObjectId.isValid(dropId)) {
			res.status(400).json({ success: false, error: "Invalid drop ID" });
			return;
		}

		// Check if drop exists
		const drop = await Drop.findById(dropId);
		if (!drop) {
			res.status(404).json({ success: false, error: "Drop not found" });
			return;
		}

		// Check if drop has items
		const itemCount = await Item.countDocuments({ drop_id: dropId });

		// If drop has items and removeItems is not set, warn user
		if (itemCount > 0 && removeItems !== "true") {
			res.status(400).json({
				success: false,
				error: `Cannot delete drop. It contains ${itemCount} item(s). Use ?removeItems=true to remove items and delete the drop.`,
				data: { itemCount },
			});
			return;
		}

		// If removeItems is true, remove items from drop first
		if (removeItems === "true" && itemCount > 0) {
			await Item.updateMany({ drop_id: dropId }, { $unset: { drop_id: "" } });
		}

		// Delete the drop
		await Drop.findByIdAndDelete(dropId);

		res.status(200).json({
			success: true,
			message: "Drop deleted successfully",
			data: {
				id: dropId,
				itemsRemoved: removeItems === "true" ? itemCount : 0,
			},
		});
	} catch (error) {
		console.error("Error in deleteDrop:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getDropItems = async (req: Request, res: Response): Promise<void> => {
	try {
		const dropId = req.params.id;

		// Validate drop ID
		if (!mongoose.Types.ObjectId.isValid(dropId)) {
			res.status(400).json({ success: false, error: "Invalid drop ID" });
			return;
		}

		// Check if drop exists
		const drop = await Drop.findById(dropId);
		if (!drop) {
			res.status(404).json({ success: false, error: "Drop not found" });
			return;
		}

		// Get all items in this drop
		const items = await Item.find({ drop_id: dropId });

		res.status(200).json({
			success: true,
			data: items,
			count: items.length,
		});
	} catch (error) {
		console.error("Error in getDropItems:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const addItemToDrop = async (req: Request, res: Response): Promise<void> => {
	try {
		const dropId = req.params.id;
		const { itemId, itemIds } = req.body;

		// Validate drop ID
		if (!mongoose.Types.ObjectId.isValid(dropId)) {
			res.status(400).json({ success: false, error: "Invalid drop ID" });
			return;
		}

		// Check if drop exists
		const drop = await Drop.findById(dropId);
		if (!drop) {
			res.status(404).json({ success: false, error: "Drop not found" });
			return;
		}

		// Support both single itemId and array of itemIds
		const itemsToAdd = itemIds || (itemId ? [itemId] : []);

		if (itemsToAdd.length === 0) {
			res.status(400).json({
				success: false,
				error: "Please provide itemId or itemIds in request body",
			});
			return;
		}

		// Validate all item IDs
		const invalidIds = itemsToAdd.filter(
			(id: string) => !mongoose.Types.ObjectId.isValid(id),
		);
		if (invalidIds.length > 0) {
			res.status(400).json({
				success: false,
				error: `Invalid item ID(s): ${invalidIds.join(", ")}`,
			});
			return;
		}

		// Check if all items exist
		const items = await Item.find({ _id: { $in: itemsToAdd } });
		if (items.length !== itemsToAdd.length) {
			const foundIds = items.map((item) => String(item._id));
			const notFound = itemsToAdd.filter(
				(id: string) => !foundIds.includes(id),
			);
			res.status(404).json({
				success: false,
				error: `Item(s) not found: ${notFound.join(", ")}`,
			});
			return;
		}

		// Update items to add them to the drop
		const updateData: any = { $set: { drop_id: dropId } };
		
		// Set item status based on drop status:
		// - "upcoming" → items become "pending"
		// - "active" → items become "available"
		if (drop.status === DropStatus.Upcoming) {
			updateData.$set.itemStatus = ItemStatus.Pending;
		} else if (drop.status === DropStatus.Active) {
			updateData.$set.itemStatus = ItemStatus.Available;
		}

		const result = await Item.updateMany(
			{ _id: { $in: itemsToAdd } },
			updateData,
		);

		res.status(200).json({
			success: true,
			message: `Successfully added ${result.modifiedCount} item(s) to drop`,
			data: {
				dropId,
				itemsAdded: result.modifiedCount,
				itemIds: itemsToAdd,
				itemsSetToPending: drop.status === DropStatus.Upcoming ? result.modifiedCount : 0,
				itemsSetToAvailable: drop.status === DropStatus.Active ? result.modifiedCount : 0,
			},
		});
	} catch (error) {
		console.error("Error in addItemToDrop:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const removeItemFromDrop = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const dropId = req.params.id;
		const itemId = req.params.itemId;

		// Validate IDs
		if (!mongoose.Types.ObjectId.isValid(dropId)) {
			res.status(400).json({ success: false, error: "Invalid drop ID" });
			return;
		}

		if (!mongoose.Types.ObjectId.isValid(itemId)) {
			res.status(400).json({ success: false, error: "Invalid item ID" });
			return;
		}

		// Check if drop exists
		const drop = await Drop.findById(dropId);
		if (!drop) {
			res.status(404).json({ success: false, error: "Drop not found" });
			return;
		}

		// Check if item exists and belongs to this drop
		const item = await Item.findOne({ _id: itemId, drop_id: dropId });
		if (!item) {
			res.status(404).json({
				success: false,
				error: "Item not found or does not belong to this drop",
			});
			return;
		}

		// Remove item from drop and revert status to approved
		await Item.updateOne(
			{ _id: itemId },
			{ $unset: { drop_id: "" }, $set: { itemStatus: ItemStatus.Approved } },
		);

		res.status(200).json({
			success: true,
			message: "Item successfully removed from drop",
			data: {
				dropId,
				itemId,
			},
		});
	} catch (error) {
		console.error("Error in removeItemFromDrop:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getDrops,
	getDropById,
	createDrop,
	updateDrop,
	deleteDrop,
	getDropItems,
	addItemToDrop,
	removeItemFromDrop,
};
