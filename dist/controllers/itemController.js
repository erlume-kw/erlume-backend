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
const Item_1 = __importDefault(require("../models/Item"));
const Category_1 = __importDefault(require("../models/Category"));
const SubCategory_1 = __importDefault(require("../models/SubCategory"));
const Drop_1 = __importDefault(require("../models/Drop"));
const Seller_1 = __importDefault(require("../models/Seller"));
const mongoose_1 = __importDefault(require("mongoose"));
const itemEnums_1 = require("../enums/itemEnums");
const statusEnums_1 = require("../enums/statusEnums");
const flowEnums_1 = require("../enums/flowEnums");
const dateRange_1 = require("../utils/dateRange");
const notifications_1 = require("../utils/notifications");
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const getItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { 
        // IDs (snake_case — matches schema)
        drop_id, category_id, sub_category_id, seller_id, 
        // Enums
        itemStatus, authenticationStatus, returnStatus, condition, 
        // Text search
        search, brandName, 
        // Price range
        minPrice, maxPrice, 
        // Date filter
        year, month, 
        // Pagination
        page, limit, } = req.query;
        // --- Pagination ---
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit) || DEFAULT_PAGE_SIZE));
        const skip = (pageNum - 1) * limitNum;
        // --- Build filter ---
        const filter = {};
        // Date range
        const { range, error } = (0, dateRange_1.getMonthYearDateRange)(year, month);
        if (error) {
            res.status(400).json({ success: false, error });
            return;
        }
        if (range)
            filter.uploadedAt = range;
        // ObjectId filters
        if (drop_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(drop_id)) {
                res.status(400).json({ success: false, error: "Invalid drop_id" });
                return;
            }
            filter.drop_id = drop_id;
        }
        if (category_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(category_id)) {
                res.status(400).json({ success: false, error: "Invalid category_id" });
                return;
            }
            filter.category_id = category_id;
        }
        if (sub_category_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(sub_category_id)) {
                res.status(400).json({ success: false, error: "Invalid sub_category_id" });
                return;
            }
            filter.sub_category_id = sub_category_id;
        }
        if (seller_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(seller_id)) {
                res.status(400).json({ success: false, error: "Invalid seller_id" });
                return;
            }
            filter.seller_id = seller_id;
        }
        // Enum filters
        if (itemStatus) {
            if (!Object.values(statusEnums_1.ItemStatus).includes(itemStatus)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid itemStatus. Must be one of: ${Object.values(statusEnums_1.ItemStatus).join(", ")}`,
                });
                return;
            }
            filter.itemStatus = itemStatus;
        }
        if (condition) {
            if (!Object.values(itemEnums_1.ItemCondition).includes(condition)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid condition. Must be one of: ${Object.values(itemEnums_1.ItemCondition).join(", ")}`,
                });
                return;
            }
            filter.condition = condition;
        }
        if (authenticationStatus) {
            if (!Object.values(flowEnums_1.AuthenticationStatus).includes(authenticationStatus)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid authenticationStatus. Must be one of: ${Object.values(flowEnums_1.AuthenticationStatus).join(", ")}`,
                });
                return;
            }
            filter.authenticationStatus = authenticationStatus;
        }
        if (returnStatus) {
            if (!Object.values(flowEnums_1.ReturnStatus).includes(returnStatus)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid returnStatus. Must be one of: ${Object.values(flowEnums_1.ReturnStatus).join(", ")}`,
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
        const priceConditions = [];
        if (minPrice) {
            const min = parseFloat(minPrice);
            if (!isNaN(min))
                priceConditions.push({ $gte: [{ $toDouble: "$listingPrice" }, min] });
        }
        if (maxPrice) {
            const max = parseFloat(maxPrice);
            if (!isNaN(max))
                priceConditions.push({ $lte: [{ $toDouble: "$listingPrice" }, max] });
        }
        if (priceConditions.length > 0) {
            filter.$expr = { $and: priceConditions };
        }
        // --- Query with pagination ---
        const [items, totalCount] = yield Promise.all([
            Item_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
            Item_1.default.countDocuments(filter),
        ]);
        const totalPages = Math.ceil(totalCount / limitNum);
        const data = items.map((item) => { var _a; return (Object.assign(Object.assign({}, item), { sellerId: (_a = item.seller_id) !== null && _a !== void 0 ? _a : null })); });
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
    }
    catch (error) {
        console.error("Error in getItems:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
const getItemById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const itemId = req.params.id;
        // Validate item ID
        if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
            res.status(400).json({ success: false, error: "Invalid item ID" });
            return;
        }
        // Find item by ID
        const item = yield Item_1.default.findById(itemId).lean();
        if (!item) {
            res.status(404).json({ success: false, error: "Item not found" });
            return;
        }
        res.status(200).json({
            success: true,
            data: Object.assign(Object.assign({}, item), { sellerId: (_a = item.seller_id) !== null && _a !== void 0 ? _a : null }),
        });
    }
    catch (error) {
        console.error("Error in getItemById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { basePrice, condition, uploadedAt, saleRate, itemStatus, color, size, itemName, itemModel, year, quantity, brandName, imageUrls, bag, photoUrls, receiptPhotoUrls, priceEstimatorUrls, quoteUrls, approved, approvedNextDrop, orderId, authNeeded, cleaningNeeded, listingPrice, photographed, category_id, sub_category_id, drop_id, sellerId: sellerIdParam, seller_id: sellerIdAlt, authenticationStatus, authenticatedAt, returnDate, returnStatus, } = req.body;
        const resolvedItemName = itemName !== null && itemName !== void 0 ? itemName : bag;
        const imageUrlsArray = Array.isArray(imageUrls) ? imageUrls : undefined;
        const photoUrlsArray = Array.isArray(photoUrls) ? photoUrls : undefined;
        const resolvedImageUrls = [
            ...new Set([...(imageUrlsArray !== null && imageUrlsArray !== void 0 ? imageUrlsArray : []), ...(photoUrlsArray !== null && photoUrlsArray !== void 0 ? photoUrlsArray : [])]),
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
        if (!basePrice ||
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
            String(listingPrice).trim() === "") {
            res.status(400).json({
                success: false,
                error: "Missing required fields: basePrice, condition, uploadedAt, saleRate, color, size, itemName (or bag), quantity, brandName, imageUrls (or photoUrls), category_id, listingPrice",
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
        if (!Object.values(itemEnums_1.ItemCondition).includes(condition)) {
            res.status(400).json({
                success: false,
                error: `Invalid condition. Must be one of: ${Object.values(itemEnums_1.ItemCondition).join(", ")}`,
            });
            return;
        }
        if (itemStatus && !Object.values(statusEnums_1.ItemStatus).includes(itemStatus)) {
            res.status(400).json({
                success: false,
                error: `Invalid itemStatus. Must be one of: ${Object.values(statusEnums_1.ItemStatus).join(", ")}`,
            });
            return;
        }
        if (authenticationStatus != null &&
            !Object.values(flowEnums_1.AuthenticationStatus).includes(authenticationStatus)) {
            res.status(400).json({
                success: false,
                error: `Invalid authenticationStatus. Must be one of: ${Object.values(flowEnums_1.AuthenticationStatus).join(", ")}`,
            });
            return;
        }
        if (returnStatus != null &&
            !Object.values(flowEnums_1.ReturnStatus).includes(returnStatus)) {
            res.status(400).json({
                success: false,
                error: `Invalid returnStatus. Must be one of: ${Object.values(flowEnums_1.ReturnStatus).join(", ")}`,
            });
            return;
        }
        // Validate category_id
        if (!mongoose_1.default.Types.ObjectId.isValid(category_id)) {
            res.status(400).json({ success: false, error: "Invalid category_id" });
            return;
        }
        const category = yield Category_1.default.findById(category_id);
        if (!category) {
            res.status(404).json({ success: false, error: "Category not found" });
            return;
        }
        // Validate sub_category_id if provided
        if (sub_category_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(sub_category_id)) {
                res.status(400).json({
                    success: false,
                    error: "Invalid sub_category_id",
                });
                return;
            }
            const subCategory = yield SubCategory_1.default.findById(sub_category_id);
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
            if (!mongoose_1.default.Types.ObjectId.isValid(drop_id)) {
                res.status(400).json({ success: false, error: "Invalid drop_id" });
                return;
            }
            const drop = yield Drop_1.default.findById(drop_id);
            if (!drop) {
                res.status(404).json({ success: false, error: "Drop not found" });
                return;
            }
        }
        // Validate sellerId / seller_id if provided — accept either Seller doc _id or User id
        let sellerId;
        const sellerIdRaw = sellerIdParam !== null && sellerIdParam !== void 0 ? sellerIdParam : sellerIdAlt;
        if (sellerIdRaw) {
            const idStr = String(sellerIdRaw).trim();
            if (!mongoose_1.default.Types.ObjectId.isValid(idStr)) {
                res.status(400).json({ success: false, error: "Invalid sellerId" });
                return;
            }
            // Try Seller doc _id first; if found, resolve to its userId (User _id)
            let sellerDoc = yield Seller_1.default.findById(idStr);
            if (sellerDoc) {
                sellerId = String(sellerDoc.userId);
            }
            else {
                sellerDoc = yield Seller_1.default.findOne({ userId: idStr });
                if (sellerDoc) {
                    sellerId = idStr; // already a User _id
                }
                else {
                    res.status(404).json({ success: false, error: "Seller not found" });
                    return;
                }
            }
        }
        // Create new item
        const newItem = new Item_1.default({
            basePrice,
            condition,
            uploadedAt: new Date(uploadedAt),
            saleRate,
            itemStatus: itemStatus || statusEnums_1.ItemStatus.Pending,
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
        const savedItem = yield newItem.save();
        // If sellerId is provided, attach the new item to the seller
        if (sellerId) {
            yield Seller_1.default.findOneAndUpdate({ userId: sellerId }, { $addToSet: { itemIds: savedItem._id } }, { new: true });
        }
        res.status(201).json({
            success: true,
            message: "Item created successfully",
            data: savedItem,
        });
    }
    catch (error) {
        console.error("Error in createItem:", error);
        // Handle validation errors
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
const updateItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const itemId = req.params.id;
        const updateData = Object.assign({}, req.body);
        // Validate item ID
        if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
            res.status(400).json({ success: false, error: "Invalid item ID" });
            return;
        }
        // Check if item exists
        const existingItem = yield Item_1.default.findById(itemId);
        if (!existingItem) {
            res.status(404).json({ success: false, error: "Item not found" });
            return;
        }
        // listingPrice is required; reject empty if provided
        if ("listingPrice" in updateData &&
            (updateData.listingPrice == null ||
                String(updateData.listingPrice).trim() === "")) {
            res.status(400).json({
                success: false,
                error: "listingPrice is required and cannot be empty",
            });
            return;
        }
        // Validate enum values if provided
        if (updateData.condition) {
            if (!Object.values(itemEnums_1.ItemCondition).includes(updateData.condition)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid condition. Must be one of: ${Object.values(itemEnums_1.ItemCondition).join(", ")}`,
                });
                return;
            }
        }
        if (updateData.itemStatus) {
            if (!Object.values(statusEnums_1.ItemStatus).includes(updateData.itemStatus)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid itemStatus. Must be one of: ${Object.values(statusEnums_1.ItemStatus).join(", ")}`,
                });
                return;
            }
        }
        if (updateData.authenticationStatus != null &&
            !Object.values(flowEnums_1.AuthenticationStatus).includes(updateData.authenticationStatus)) {
            res.status(400).json({
                success: false,
                error: `Invalid authenticationStatus. Must be one of: ${Object.values(flowEnums_1.AuthenticationStatus).join(", ")}`,
            });
            return;
        }
        if (updateData.returnStatus != null &&
            !Object.values(flowEnums_1.ReturnStatus).includes(updateData.returnStatus)) {
            res.status(400).json({
                success: false,
                error: `Invalid returnStatus. Must be one of: ${Object.values(flowEnums_1.ReturnStatus).join(", ")}`,
            });
            return;
        }
        // Validate imageUrls if provided
        if (updateData.imageUrls !== undefined) {
            if (!Array.isArray(updateData.imageUrls) ||
                updateData.imageUrls.length === 0) {
                res.status(400).json({
                    success: false,
                    error: "imageUrls must be a non-empty array",
                });
                return;
            }
        }
        if (updateData.photoUrls !== undefined) {
            if (!Array.isArray(updateData.photoUrls) ||
                updateData.photoUrls.length === 0) {
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
        if (updateData.photoUrls !== undefined ||
            updateData.imageUrls !== undefined) {
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
            if (!mongoose_1.default.Types.ObjectId.isValid(updateData.category_id)) {
                res.status(400).json({ success: false, error: "Invalid category_id" });
                return;
            }
            const category = yield Category_1.default.findById(updateData.category_id);
            if (!category) {
                res.status(404).json({ success: false, error: "Category not found" });
                return;
            }
        }
        // Validate sub_category_id if provided
        if (updateData.sub_category_id !== undefined) {
            if (updateData.sub_category_id === null ||
                updateData.sub_category_id === "") {
                // Allow clearing sub_category_id
                updateData.sub_category_id = undefined;
            }
            else {
                if (!mongoose_1.default.Types.ObjectId.isValid(updateData.sub_category_id)) {
                    res.status(400).json({
                        success: false,
                        error: "Invalid sub_category_id",
                    });
                    return;
                }
                const subCategory = yield SubCategory_1.default.findById(updateData.sub_category_id);
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
            }
            else {
                if (!mongoose_1.default.Types.ObjectId.isValid(updateData.drop_id)) {
                    res.status(400).json({ success: false, error: "Invalid drop_id" });
                    return;
                }
                const drop = yield Drop_1.default.findById(updateData.drop_id);
                if (!drop) {
                    res.status(404).json({ success: false, error: "Drop not found" });
                    return;
                }
            }
        }
        // Validate sellerId / seller_id if provided (accept either; support Seller doc _id or User id)
        let sellerId;
        const sellerIdRaw = (_b = (_a = updateData.sellerId) !== null && _a !== void 0 ? _a : updateData.seller_id) !== null && _b !== void 0 ? _b : undefined;
        if (sellerIdRaw !== undefined) {
            if (sellerIdRaw === null || sellerIdRaw === "") {
                sellerId = null;
                updateData.seller_id = null;
            }
            else {
                const idStr = String(sellerIdRaw).trim();
                if (!mongoose_1.default.Types.ObjectId.isValid(idStr)) {
                    res.status(400).json({ success: false, error: "Invalid sellerId/seller_id" });
                    return;
                }
                // Resolve: accept either Seller doc _id or User id (userId)
                let seller = yield Seller_1.default.findById(idStr);
                if (seller) {
                    sellerId = String(seller.userId);
                }
                else {
                    seller = yield Seller_1.default.findOne({ userId: idStr });
                    if (seller) {
                        sellerId = idStr;
                    }
                    else {
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
        const updatedItem = yield Item_1.default.findByIdAndUpdate(itemId, updateData, {
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
                    yield Seller_1.default.updateOne({ userId: previousSellerId }, { $pull: { itemIds: itemId } });
                }
            }
            else {
                if (previousSellerId && previousSellerId !== sellerId) {
                    yield Seller_1.default.updateOne({ userId: previousSellerId }, { $pull: { itemIds: itemId } });
                }
                yield Seller_1.default.updateOne({ userId: sellerId }, { $addToSet: { itemIds: itemId } });
            }
        }
        // ── Seller return notification ────────────────────────────────────────────
        const prevReturnStatus = existingItem.returnStatus;
        const newReturnStatus = updateData.returnStatus;
        const isReturnTrigger = newReturnStatus &&
            newReturnStatus !== prevReturnStatus &&
            (newReturnStatus === flowEnums_1.ReturnStatus.Scheduled || newReturnStatus === flowEnums_1.ReturnStatus.Returned);
        if (isReturnTrigger && updatedItem.seller_id) {
            const seller = yield Seller_1.default.findOne({ userId: updatedItem.seller_id }).lean();
            if (seller === null || seller === void 0 ? void 0 : seller.phoneNumber) {
                const returnDateStr = updatedItem.returnDate
                    ? new Date(updatedItem.returnDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })
                    : undefined;
                void (0, notifications_1.sendSellerReturnNotification)({
                    phoneNumber: seller.phoneNumber,
                    sellerName: seller.fullName || "there",
                    brandName: updatedItem.brandName,
                    itemName: updatedItem.itemName,
                    returnStatus: newReturnStatus,
                    returnDate: returnDateStr,
                });
            }
        }
        res.status(200).json({
            success: true,
            message: "Item updated successfully",
            data: updatedItem,
        });
    }
    catch (error) {
        console.error("Error in updateItem:", error);
        // Handle validation errors
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
const deleteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const itemId = req.params.id;
        // Validate item ID
        if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
            res.status(400).json({ success: false, error: "Invalid item ID" });
            return;
        }
        // Check if item exists
        const item = yield Item_1.default.findById(itemId);
        if (!item) {
            res.status(404).json({ success: false, error: "Item not found" });
            return;
        }
        // Delete item (cascade delete will handle OrderItems and OutfitItems)
        yield Item_1.default.findByIdAndDelete(itemId);
        res.status(200).json({
            success: true,
            message: "Item deleted successfully",
            data: { id: itemId },
        });
    }
    catch (error) {
        console.error("Error in deleteItem:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
};
