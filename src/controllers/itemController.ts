import { Request, Response } from "express";
import Item from "../models/Item";
import Category from "../models/Category";
import SubCategory from "../models/SubCategory";
import Drop from "../models/Drop";
import Seller from "../models/Seller";
import mongoose from "mongoose";
import { ItemCondition } from "../enums/itemEnums";
import { ItemStatus } from "../enums/statusEnums";
import { AuthenticationStatus, ReturnStatus } from "../enums/flowEnums";
import { getMonthYearDateRange } from "../utils/dateRange";

const getItems = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			dropId,
			itemStatus,
			categoryId,
			sellerId,
			authenticationStatus,
			returnStatus,
			year,
			month,
		} = req.query;

		console.log("getItems called, dropId:", dropId);

		// Build filters from query params
		const filter: any = {};
		const { range, error } = getMonthYearDateRange(year, month);
		if (error) {
			res.status(400).json({ success: false, error });
			return;
		}
		if (range) {
			filter.uploadedAt = range;
		}
		if (dropId) {
			if (!mongoose.Types.ObjectId.isValid(dropId as string)) {
				res.status(400).json({ success: false, error: "Invalid drop ID" });
				return;
			}
			filter.drop_id = dropId;
		}
		if (categoryId) {
			if (!mongoose.Types.ObjectId.isValid(categoryId as string)) {
				res.status(400).json({ success: false, error: "Invalid category ID" });
				return;
			}
			filter.category_id = categoryId;
		}
		if (sellerId) {
			if (!mongoose.Types.ObjectId.isValid(sellerId as string)) {
				res.status(400).json({ success: false, error: "Invalid sellerId" });
				return;
			}
			filter.seller_id = sellerId;
		}
		if (itemStatus) {
			if (!Object.values(ItemStatus).includes(itemStatus as ItemStatus)) {
				res.status(400).json({
					success: false,
					error: `Invalid itemStatus. Must be one of: ${Object.values(
						ItemStatus,
					).join(", ")}`,
				});
				return;
			}
			filter.itemStatus = itemStatus;
		}
		if (authenticationStatus) {
			if (
				!Object.values(AuthenticationStatus).includes(
					authenticationStatus as AuthenticationStatus,
				)
			) {
				res.status(400).json({
					success: false,
					error: `Invalid authenticationStatus. Must be one of: ${Object.values(
						AuthenticationStatus,
					).join(", ")}`,
				});
				return;
			}
			filter.authenticationStatus = authenticationStatus;
		}
		if (returnStatus) {
			if (!Object.values(ReturnStatus).includes(returnStatus as ReturnStatus)) {
				res.status(400).json({
					success: false,
					error: `Invalid returnStatus. Must be one of: ${Object.values(
						ReturnStatus,
					).join(", ")}`,
				});
				return;
			}
			filter.returnStatus = returnStatus;
		}

		// If any filter provided, use it
		if (Object.keys(filter).length > 0) {
			const items = await Item.find(filter).lean();
			const data = items.map((item) => ({
				...item,
				sellerId: item.seller_id ?? null,
			}));
			console.log(`Found ${items.length} items with filters`);
			res.status(200).json({ success: true, data, count: items.length });
			return;
		}

		// Otherwise, get all items
		const items = await Item.find({}).lean();
		const data = items.map((item) => ({
			...item,
			sellerId: item.seller_id ?? null,
		}));
		console.log(`Found ${items.length} total items`);
		res.status(200).json({ success: true, data, count: items.length });
	} catch (error) {
		console.error("Error in getItems:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
			message: error instanceof Error ? error.message : "Unknown error",
		});
	}
};

const getItemById = async (req: Request, res: Response): Promise<void> => {
	try {
		const itemId = req.params.id;

		// Validate item ID
		if (!mongoose.Types.ObjectId.isValid(itemId)) {
			res.status(400).json({ success: false, error: "Invalid item ID" });
			return;
		}

		// Find item by ID
		const item = await Item.findById(itemId).lean();

		if (!item) {
			res.status(404).json({ success: false, error: "Item not found" });
			return;
		}

		res.status(200).json({
			success: true,
			data: { ...item, sellerId: item.seller_id ?? null },
		});
	} catch (error) {
		console.error("Error in getItemById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createItem = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			basePrice,
			condition,
			uploadedAt,
			saleRate,
			itemStatus,
			color,
			size,
			itemName,
			itemModel,
			year,
			quantity,
			brandName,
			imageUrls,
			bag,
			brand,
			photoUrls,
			receiptPhotoUrls,
			priceEstimatorUrls,
			quoteUrls,
			approved,
			approvedNextDrop,
			orderId,
			authNeeded,
			cleaningNeeded,
			listingPrice,
			photographed,
			category_id,
			sub_category_id,
			drop_id,
			sellerId,
			authenticationStatus,
			authenticatedAt,
			returnDate,
			returnStatus,
		} = req.body;

		const resolvedItemName = itemName ?? bag;
		const resolvedBrandName = brandName ?? brand;
		const imageUrlsArray = Array.isArray(imageUrls) ? imageUrls : undefined;
		const photoUrlsArray = Array.isArray(photoUrls) ? photoUrls : undefined;
		const resolvedImageUrls = [
			...new Set([...(imageUrlsArray ?? []), ...(photoUrlsArray ?? [])]),
		];

		if (imageUrls !== undefined && !Array.isArray(imageUrls)) {
			res.status(400).json({
				success: false,
				error: "imageUrls must be an array",
			});
			return;
		}

		if (photoUrls !== undefined && !Array.isArray(photoUrls)) {
			res.status(400).json({
				success: false,
				error: "photoUrls must be an array",
			});
			return;
		}

		// Validate required fields
		if (
			!basePrice ||
			!condition ||
			!uploadedAt ||
			!saleRate ||
			!itemStatus ||
			!color ||
			!size ||
			!resolvedItemName ||
			!quantity ||
			!resolvedBrandName ||
			resolvedImageUrls.length === 0 ||
			!category_id ||
			listingPrice === undefined ||
			listingPrice === null ||
			String(listingPrice).trim() === ""
		) {
			res.status(400).json({
				success: false,
				error:
					"Missing required fields: basePrice, condition, uploadedAt, saleRate, itemStatus, color, size, itemName (or bag), quantity, brandName (or brand), imageUrls (or photoUrls), category_id, listingPrice",
			});
			return;
		}

		// Validate imageUrls is an array
		if (resolvedImageUrls.length === 0) {
			res.status(400).json({
				success: false,
				error: "imageUrls must be a non-empty array",
			});
			return;
		}

		// Validate enum values
		if (!Object.values(ItemCondition).includes(condition)) {
			res.status(400).json({
				success: false,
				error: `Invalid condition. Must be one of: ${Object.values(
					ItemCondition,
				).join(", ")}`,
			});
			return;
		}

		if (!Object.values(ItemStatus).includes(itemStatus)) {
			res.status(400).json({
				success: false,
				error: `Invalid itemStatus. Must be one of: ${Object.values(
					ItemStatus,
				).join(", ")}`,
			});
			return;
		}

		if (
			authenticationStatus != null &&
			!Object.values(AuthenticationStatus).includes(authenticationStatus)
		) {
			res.status(400).json({
				success: false,
				error: `Invalid authenticationStatus. Must be one of: ${Object.values(
					AuthenticationStatus,
				).join(", ")}`,
			});
			return;
		}

		if (
			returnStatus != null &&
			!Object.values(ReturnStatus).includes(returnStatus)
		) {
			res.status(400).json({
				success: false,
				error: `Invalid returnStatus. Must be one of: ${Object.values(
					ReturnStatus,
				).join(", ")}`,
			});
			return;
		}

		// Validate category_id
		if (!mongoose.Types.ObjectId.isValid(category_id)) {
			res.status(400).json({ success: false, error: "Invalid category_id" });
			return;
		}

		const category = await Category.findById(category_id);
		if (!category) {
			res.status(404).json({ success: false, error: "Category not found" });
			return;
		}

		// Validate sub_category_id if provided
		if (sub_category_id) {
			if (!mongoose.Types.ObjectId.isValid(sub_category_id)) {
				res.status(400).json({
					success: false,
					error: "Invalid sub_category_id",
				});
				return;
			}

			const subCategory = await SubCategory.findById(sub_category_id);
			if (!subCategory) {
				res.status(404).json({
					success: false,
					error: "SubCategory not found",
				});
				return;
			}

			// Verify subcategory belongs to the category
			if (subCategory.category_id.toString() !== category_id.toString()) {
				res.status(400).json({
					success: false,
					error: "SubCategory does not belong to the specified Category",
				});
				return;
			}
		}

		// Validate drop_id if provided
		if (drop_id) {
			if (!mongoose.Types.ObjectId.isValid(drop_id)) {
				res.status(400).json({ success: false, error: "Invalid drop_id" });
				return;
			}

			const drop = await Drop.findById(drop_id);
			if (!drop) {
				res.status(404).json({ success: false, error: "Drop not found" });
				return;
			}
		}

		// Validate sellerId if provided (sellerId is the userId of the seller)
		if (sellerId) {
			if (!mongoose.Types.ObjectId.isValid(sellerId)) {
				res.status(400).json({ success: false, error: "Invalid sellerId" });
				return;
			}

			const seller = await Seller.findOne({ userId: sellerId });
			if (!seller) {
				res.status(404).json({ success: false, error: "Seller not found" });
				return;
			}
		}

		// Create new item
		const newItem = new Item({
			basePrice,
			condition,
			uploadedAt: new Date(uploadedAt),
			saleRate,
			itemStatus,
			color,
			size,
			itemName: resolvedItemName,
			itemModel,
			year,
			quantity,
			brandName: resolvedBrandName,
			imageUrls: resolvedImageUrls,
			receiptPhotoUrls,
			priceEstimatorUrls,
			quoteUrls,
			approved,
			approvedNextDrop,
			orderId,
			authNeeded,
			cleaningNeeded,
			listingPrice,
			photographed,
			authenticationStatus,
			authenticatedAt: authenticatedAt ? new Date(authenticatedAt) : undefined,
			returnDate: returnDate ? new Date(returnDate) : undefined,
			returnStatus,
			seller_id: sellerId,
			category_id,
			sub_category_id,
			drop_id,
		});

		const savedItem = await newItem.save();

		// If sellerId is provided, attach the new item to the seller
		if (sellerId) {
			await Seller.findOneAndUpdate(
				{ userId: sellerId },
				{ $addToSet: { itemIds: savedItem._id } },
				{ new: true },
			);
		}

		res.status(201).json({
			success: true,
			message: "Item created successfully",
			data: savedItem,
		});
	} catch (error: any) {
		console.error("Error in createItem:", error);

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

const updateItem = async (req: Request, res: Response): Promise<void> => {
	try {
		const itemId = req.params.id;
		const updateData = { ...req.body };

		// Validate item ID
		if (!mongoose.Types.ObjectId.isValid(itemId)) {
			res.status(400).json({ success: false, error: "Invalid item ID" });
			return;
		}

		// Check if item exists
		const existingItem = await Item.findById(itemId);
		if (!existingItem) {
			res.status(404).json({ success: false, error: "Item not found" });
			return;
		}

		// listingPrice is required; reject empty if provided
		if (
			"listingPrice" in updateData &&
			(updateData.listingPrice == null || String(updateData.listingPrice).trim() === "")
		) {
			res.status(400).json({
				success: false,
				error: "listingPrice is required and cannot be empty",
			});
			return;
		}

		// Validate enum values if provided
		if (updateData.condition) {
			if (!Object.values(ItemCondition).includes(updateData.condition)) {
				res.status(400).json({
					success: false,
					error: `Invalid condition. Must be one of: ${Object.values(
						ItemCondition,
					).join(", ")}`,
				});
				return;
			}
		}

		if (updateData.itemStatus) {
			if (!Object.values(ItemStatus).includes(updateData.itemStatus)) {
				res.status(400).json({
					success: false,
					error: `Invalid itemStatus. Must be one of: ${Object.values(
						ItemStatus,
					).join(", ")}`,
				});
				return;
			}
		}

		if (
			updateData.authenticationStatus != null &&
			!Object.values(AuthenticationStatus).includes(
				updateData.authenticationStatus,
			)
		) {
			res.status(400).json({
				success: false,
				error: `Invalid authenticationStatus. Must be one of: ${Object.values(
					AuthenticationStatus,
				).join(", ")}`,
			});
			return;
		}

		if (
			updateData.returnStatus != null &&
			!Object.values(ReturnStatus).includes(updateData.returnStatus)
		) {
			res.status(400).json({
				success: false,
				error: `Invalid returnStatus. Must be one of: ${Object.values(
					ReturnStatus,
				).join(", ")}`,
			});
			return;
		}

		// Validate imageUrls if provided
		if (updateData.imageUrls !== undefined) {
			if (
				!Array.isArray(updateData.imageUrls) ||
				updateData.imageUrls.length === 0
			) {
				res.status(400).json({
					success: false,
					error: "imageUrls must be a non-empty array",
				});
				return;
			}
		}
		if (updateData.photoUrls !== undefined) {
			if (
				!Array.isArray(updateData.photoUrls) ||
				updateData.photoUrls.length === 0
			) {
				res.status(400).json({
					success: false,
					error: "photoUrls must be a non-empty array",
				});
				return;
			}
		}

		// Map form aliases to model fields
		if (updateData.bag !== undefined && updateData.itemName === undefined) {
			updateData.itemName = updateData.bag;
		}
		if (updateData.brand !== undefined && updateData.brandName === undefined) {
			updateData.brandName = updateData.brand;
		}
		if (
			updateData.photoUrls !== undefined ||
			updateData.imageUrls !== undefined
		) {
			const imageUrlsArray = Array.isArray(updateData.imageUrls)
				? updateData.imageUrls
				: [];
			const photoUrlsArray = Array.isArray(updateData.photoUrls)
				? updateData.photoUrls
				: [];
			const mergedImageUrls = [
				...new Set([...imageUrlsArray, ...photoUrlsArray]),
			];

			if (mergedImageUrls.length === 0) {
				res.status(400).json({
					success: false,
					error: "imageUrls must be a non-empty array",
				});
				return;
			}

			updateData.imageUrls = mergedImageUrls;
		}
		delete updateData.bag;
		delete updateData.brand;
		delete updateData.photoUrls;

		// Validate category_id if provided
		if (updateData.category_id) {
			if (!mongoose.Types.ObjectId.isValid(updateData.category_id)) {
				res.status(400).json({ success: false, error: "Invalid category_id" });
				return;
			}

			const category = await Category.findById(updateData.category_id);
			if (!category) {
				res.status(404).json({ success: false, error: "Category not found" });
				return;
			}
		}

		// Validate sub_category_id if provided
		if (updateData.sub_category_id !== undefined) {
			if (
				updateData.sub_category_id === null ||
				updateData.sub_category_id === ""
			) {
				// Allow clearing sub_category_id
				updateData.sub_category_id = undefined;
			} else {
				if (!mongoose.Types.ObjectId.isValid(updateData.sub_category_id)) {
					res.status(400).json({
						success: false,
						error: "Invalid sub_category_id",
					});
					return;
				}

				const subCategory = await SubCategory.findById(
					updateData.sub_category_id,
				);
				if (!subCategory) {
					res.status(404).json({
						success: false,
						error: "SubCategory not found",
					});
					return;
				}

				// Verify subcategory belongs to the category
				const categoryId = updateData.category_id || existingItem.category_id;
				if (subCategory.category_id.toString() !== categoryId.toString()) {
					res.status(400).json({
						success: false,
						error: "SubCategory does not belong to the specified Category",
					});
					return;
				}
			}
		}

		// Validate drop_id if provided
		if (updateData.drop_id !== undefined) {
			if (updateData.drop_id === null || updateData.drop_id === "") {
				// Allow clearing drop_id
				updateData.drop_id = undefined;
			} else {
				if (!mongoose.Types.ObjectId.isValid(updateData.drop_id)) {
					res.status(400).json({ success: false, error: "Invalid drop_id" });
					return;
				}

				const drop = await Drop.findById(updateData.drop_id);
				if (!drop) {
					res.status(404).json({ success: false, error: "Drop not found" });
					return;
				}
			}
		}

		// Validate sellerId if provided
		let sellerId: string | null | undefined;
		if ("sellerId" in updateData) {
			sellerId = updateData.sellerId;

			if (sellerId === null || sellerId === "") {
				updateData.seller_id = null;
			} else {
				if (typeof sellerId !== "string") {
					res.status(400).json({ success: false, error: "Invalid sellerId" });
					return;
				}

				if (!mongoose.Types.ObjectId.isValid(sellerId)) {
					res.status(400).json({ success: false, error: "Invalid sellerId" });
					return;
				}

				const seller = await Seller.findOne({ userId: sellerId });
				if (!seller) {
					res.status(404).json({ success: false, error: "Seller not found" });
					return;
				}

				updateData.seller_id = sellerId;
			}

			delete updateData.sellerId;
		}

		// Convert uploadedAt to Date if provided
		if (updateData.uploadedAt) {
			updateData.uploadedAt = new Date(updateData.uploadedAt);
		}
		if (updateData.authenticatedAt !== undefined) {
			updateData.authenticatedAt =
				updateData.authenticatedAt == null || updateData.authenticatedAt === ""
					? undefined
					: new Date(updateData.authenticatedAt);
		}
		if (updateData.returnDate !== undefined) {
			updateData.returnDate =
				updateData.returnDate == null || updateData.returnDate === ""
					? undefined
					: new Date(updateData.returnDate);
		}

		// Update item
		const updatedItem = await Item.findByIdAndUpdate(itemId, updateData, {
			new: true,
			runValidators: true,
		});

		if (!updatedItem) {
			res.status(404).json({ success: false, error: "Item not found" });
			return;
		}

		// Sync seller itemIds if sellerId was provided
		if ("sellerId" in req.body) {
			const previousSellerId = existingItem.seller_id
				? String(existingItem.seller_id)
				: null;

			if (!sellerId) {
				if (previousSellerId) {
					await Seller.updateOne(
						{ userId: previousSellerId },
						{ $pull: { itemIds: itemId } },
					);
				}
			} else {
				if (previousSellerId && previousSellerId !== sellerId) {
					await Seller.updateOne(
						{ userId: previousSellerId },
						{ $pull: { itemIds: itemId } },
					);
				}

				await Seller.updateOne(
					{ userId: sellerId },
					{ $addToSet: { itemIds: itemId } },
				);
			}
		}

		res.status(200).json({
			success: true,
			message: "Item updated successfully",
			data: updatedItem,
		});
	} catch (error: any) {
		console.error("Error in updateItem:", error);

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

const deleteItem = async (req: Request, res: Response): Promise<void> => {
	try {
		const itemId = req.params.id;

		// Validate item ID
		if (!mongoose.Types.ObjectId.isValid(itemId)) {
			res.status(400).json({ success: false, error: "Invalid item ID" });
			return;
		}

		// Check if item exists
		const item = await Item.findById(itemId);
		if (!item) {
			res.status(404).json({ success: false, error: "Item not found" });
			return;
		}

		// Delete item (cascade delete will handle OrderItems and OutfitItems)
		await Item.findByIdAndDelete(itemId);

		res.status(200).json({
			success: true,
			message: "Item deleted successfully",
			data: { id: itemId },
		});
	} catch (error) {
		console.error("Error in deleteItem:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getItems,
	getItemById,
	createItem,
	updateItem,
	deleteItem,
};
