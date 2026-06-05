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
import { sendSellerReturnNotification } from "../utils/notifications";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const getItems = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			// IDs (snake_case — matches schema)
			drop_id,
			category_id,
			sub_category_id,
			seller_id,
			// Enums
			itemStatus,
			authenticationStatus,
			returnStatus,
			condition,
			// Text search
			search,
			brandName,
			// Price range
			minPrice,
			maxPrice,
			// Date filter
			year,
			month,
			// Pagination
			page,
			limit,
		} = req.query;

		// --- Pagination ---
		const pageNum = Math.max(1, parseInt(page as string) || 1);
		const limitNum = Math.min(
			MAX_PAGE_SIZE,
			Math.max(1, parseInt(limit as string) || DEFAULT_PAGE_SIZE),
		);
		const skip = (pageNum - 1) * limitNum;

		// --- Build filter ---
		const filter: any = {};

		// Date range
		const { range, error } = getMonthYearDateRange(year, month);
		if (error) {
			res.status(400).json({ success: false, error });
			return;
		}
		if (range) filter.uploadedAt = range;

		// ObjectId filters
		if (drop_id) {
			if (!mongoose.Types.ObjectId.isValid(drop_id as string)) {
				res.status(400).json({ success: false, error: "Invalid drop_id" });
				return;
			}
			filter.drop_id = drop_id;
		}
		if (category_id) {
			if (!mongoose.Types.ObjectId.isValid(category_id as string)) {
				res.status(400).json({ success: false, error: "Invalid category_id" });
				return;
			}
			filter.category_id = category_id;
		}
		if (sub_category_id) {
			if (!mongoose.Types.ObjectId.isValid(sub_category_id as string)) {
				res.status(400).json({ success: false, error: "Invalid sub_category_id" });
				return;
			}
			filter.sub_category_id = sub_category_id;
		}
		if (seller_id) {
			if (!mongoose.Types.ObjectId.isValid(seller_id as string)) {
				res.status(400).json({ success: false, error: "Invalid seller_id" });
				return;
			}
			filter.seller_id = seller_id;
		}

		// Enum filters
		if (itemStatus) {
			if (!Object.values(ItemStatus).includes(itemStatus as ItemStatus)) {
				res.status(400).json({
					success: false,
					error: `Invalid itemStatus. Must be one of: ${Object.values(ItemStatus).join(", ")}`,
				});
				return;
			}
			filter.itemStatus = itemStatus;
		}
		if (condition) {
			if (!Object.values(ItemCondition).includes(condition as ItemCondition)) {
				res.status(400).json({
					success: false,
					error: `Invalid condition. Must be one of: ${Object.values(ItemCondition).join(", ")}`,
				});
				return;
			}
			filter.condition = condition;
		}
		if (authenticationStatus) {
			if (!Object.values(AuthenticationStatus).includes(authenticationStatus as AuthenticationStatus)) {
				res.status(400).json({
					success: false,
					error: `Invalid authenticationStatus. Must be one of: ${Object.values(AuthenticationStatus).join(", ")}`,
				});
				return;
			}
			filter.authenticationStatus = authenticationStatus;
		}
		if (returnStatus) {
			if (!Object.values(ReturnStatus).includes(returnStatus as ReturnStatus)) {
				res.status(400).json({
					success: false,
					error: `Invalid returnStatus. Must be one of: ${Object.values(ReturnStatus).join(", ")}`,
				});
				return;
			}
			filter.returnStatus = returnStatus;
		}

		// Text search — matches itemName or brandName (case-insensitive)
		if (search) {
			const regex = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
			filter.$or = [{ itemName: regex }, { brandName: regex }];
		}

		// Exact brand filter (case-insensitive) — for brand page on frontend
		if (brandName && !search) {
			filter.brandName = { $regex: new RegExp(`^${String(brandName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
		}

		// Price range — listingPrice is stored as String so use $expr + $toDouble
		const priceConditions: any[] = [];
		if (minPrice) {
			const min = parseFloat(minPrice as string);
			if (!isNaN(min)) priceConditions.push({ $gte: [{ $toDouble: "$listingPrice" }, min] });
		}
		if (maxPrice) {
			const max = parseFloat(maxPrice as string);
			if (!isNaN(max)) priceConditions.push({ $lte: [{ $toDouble: "$listingPrice" }, max] });
		}
		if (priceConditions.length > 0) {
			filter.$expr = { $and: priceConditions };
		}

		// --- Query with pagination ---
		const [items, totalCount] = await Promise.all([
			Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
			Item.countDocuments(filter),
		]);

		const totalPages = Math.ceil(totalCount / limitNum);
		const data = items.map((item) => ({ ...item, sellerId: item.seller_id ?? null }));

		res.status(200).json({
			success: true,
			data,
			pagination: {
				page: pageNum,
				limit: limitNum,
				totalCount,
				totalPages,
				hasNextPage: pageNum < totalPages,
				hasPrevPage: pageNum > 1,
			},
		});
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
			sellerId: sellerIdParam,
			seller_id: sellerIdAlt,
			authenticationStatus,
			authenticatedAt,
			returnDate,
			returnStatus,
		} = req.body;

		const resolvedItemName = itemName ?? bag;
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
			!color ||
			!size ||
			!resolvedItemName ||
			!quantity ||
			!brandName ||
			resolvedImageUrls.length === 0 ||
			!category_id ||
			listingPrice === undefined ||
			listingPrice === null ||
			String(listingPrice).trim() === ""
		) {
			res.status(400).json({
				success: false,
				error:
					"Missing required fields: basePrice, condition, uploadedAt, saleRate, color, size, itemName (or bag), quantity, brandName, imageUrls (or photoUrls), category_id, listingPrice",
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

		if (itemStatus && !Object.values(ItemStatus).includes(itemStatus)) {
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

		// Validate sellerId / seller_id if provided — accept either Seller doc _id or User id
		let sellerId: string | undefined;
		const sellerIdRaw = sellerIdParam ?? sellerIdAlt;
		if (sellerIdRaw) {
			const idStr = String(sellerIdRaw).trim();
			if (!mongoose.Types.ObjectId.isValid(idStr)) {
				res.status(400).json({ success: false, error: "Invalid sellerId" });
				return;
			}
			// Try Seller doc _id first; if found, resolve to its userId (User _id)
			let sellerDoc = await Seller.findById(idStr);
			if (sellerDoc) {
				sellerId = String(sellerDoc.userId);
			} else {
				sellerDoc = await Seller.findOne({ userId: idStr });
				if (sellerDoc) {
					sellerId = idStr; // already a User _id
				} else {
					res.status(404).json({ success: false, error: "Seller not found" });
					return;
				}
			}
		}

		// Create new item
		const newItem = new Item({
			basePrice,
			condition,
			uploadedAt: new Date(uploadedAt),
			saleRate,
			itemStatus: itemStatus || ItemStatus.Pending,
			color,
			size,
			itemName: resolvedItemName,
			itemModel,
			year,
			quantity,
			brandName,
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
			(updateData.listingPrice == null ||
				String(updateData.listingPrice).trim() === "")
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
		delete updateData.brand; // model uses brandName only
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

		// Validate sellerId / seller_id if provided (accept either; support Seller doc _id or User id)
		let sellerId: string | null | undefined;
		const sellerIdRaw =
			updateData.sellerId ?? updateData.seller_id ?? undefined;
		if (sellerIdRaw !== undefined) {
			if (sellerIdRaw === null || sellerIdRaw === "") {
				sellerId = null;
				updateData.seller_id = null;
			} else {
				const idStr = String(sellerIdRaw).trim();
				if (!mongoose.Types.ObjectId.isValid(idStr)) {
					res.status(400).json({ success: false, error: "Invalid sellerId/seller_id" });
					return;
				}

				// Resolve: accept either Seller doc _id or User id (userId)
				let seller = await Seller.findById(idStr);
				if (seller) {
					sellerId = String(seller.userId);
				} else {
					seller = await Seller.findOne({ userId: idStr });
					if (seller) {
						sellerId = idStr;
					} else {
						res.status(404).json({ success: false, error: "Seller not found" });
						return;
					}
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

		// Sync seller itemIds if sellerId or seller_id was provided
		if ("sellerId" in req.body || "seller_id" in req.body) {
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

		// ── Seller return notification ────────────────────────────────────────────
		const prevReturnStatus = existingItem.returnStatus;
		const newReturnStatus = updateData.returnStatus as string | undefined;
		const isReturnTrigger =
			newReturnStatus &&
			newReturnStatus !== prevReturnStatus &&
			(newReturnStatus === ReturnStatus.Scheduled || newReturnStatus === ReturnStatus.Returned);

		if (isReturnTrigger && updatedItem.seller_id) {
			const seller = await Seller.findOne({ userId: updatedItem.seller_id }).lean();
			if (seller?.phoneNumber) {
				const returnDateStr = updatedItem.returnDate
					? new Date(updatedItem.returnDate).toLocaleDateString("en-GB", {
							day: "numeric",
							month: "long",
							year: "numeric",
					  })
					: undefined;
				void sendSellerReturnNotification({
					phoneNumber: seller.phoneNumber,
					sellerName: seller.fullName || "there",
					brandName: updatedItem.brandName,
					itemName: updatedItem.itemName,
					returnStatus: newReturnStatus as "scheduled" | "returned",
					returnDate: returnDateStr,
				});
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
