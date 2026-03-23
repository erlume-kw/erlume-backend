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
const Drop_1 = __importDefault(require("../models/Drop"));
const Item_1 = __importDefault(require("../models/Item"));
const mongoose_1 = __importDefault(require("mongoose"));
const dropEnums_1 = require("../enums/dropEnums");
const statusEnums_1 = require("../enums/statusEnums");
const getDrops = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.query;
        // Build query - filter by status if provided
        const query = {};
        if (status) {
            if (!Object.values(dropEnums_1.DropStatus).includes(status)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${Object.values(dropEnums_1.DropStatus).join(", ")}`,
                });
                return;
            }
            query.status = status;
        }
        const drops = yield Drop_1.default.find(query).sort({ releaseDate: -1 }); // Sort by release date, newest first
        res.status(200).json({
            success: true,
            data: drops,
            count: drops.length,
        });
    }
    catch (error) {
        console.error("Error in getDrops:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getDropById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dropId = req.params.id;
        // Validate drop ID
        if (!mongoose_1.default.Types.ObjectId.isValid(dropId)) {
            res.status(400).json({ success: false, error: "Invalid drop ID" });
            return;
        }
        const drop = yield Drop_1.default.findById(dropId);
        if (!drop) {
            res.status(404).json({ success: false, error: "Drop not found" });
            return;
        }
        // Get item count for this drop
        const itemCount = yield Item_1.default.countDocuments({ drop_id: dropId });
        res.status(200).json({
            success: true,
            data: Object.assign(Object.assign({}, drop.toObject()), { itemCount }),
        });
    }
    catch (error) {
        console.error("Error in getDropById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createDrop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (status && !Object.values(dropEnums_1.DropStatus).includes(status)) {
            res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${Object.values(dropEnums_1.DropStatus).join(", ")}`,
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
        const dropStatus = status || dropEnums_1.DropStatus.Upcoming;
        const newDrop = new Drop_1.default({
            name,
            description,
            releaseDate: releaseDateObj,
            status: dropStatus,
        });
        const savedDrop = yield newDrop.save();
        // Set item status based on drop status:
        // - "upcoming" → items become "pending"
        // - "active" → items become "available"
        if (dropStatus === dropEnums_1.DropStatus.Upcoming) {
            yield Item_1.default.updateMany({ drop_id: savedDrop._id }, { $set: { itemStatus: statusEnums_1.ItemStatus.Pending } });
        }
        else if (dropStatus === dropEnums_1.DropStatus.Active) {
            yield Item_1.default.updateMany({ drop_id: savedDrop._id }, { $set: { itemStatus: statusEnums_1.ItemStatus.Available } });
        }
        res.status(201).json({
            success: true,
            message: "Drop created successfully",
            data: savedDrop,
        });
    }
    catch (error) {
        console.error("Error in createDrop:", error);
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
const updateDrop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dropId = req.params.id;
        const updateData = Object.assign({}, req.body);
        // Validate drop ID
        if (!mongoose_1.default.Types.ObjectId.isValid(dropId)) {
            res.status(400).json({ success: false, error: "Invalid drop ID" });
            return;
        }
        // Check if drop exists
        const existingDrop = yield Drop_1.default.findById(dropId);
        if (!existingDrop) {
            res.status(404).json({ success: false, error: "Drop not found" });
            return;
        }
        // Validate status if provided
        if (updateData.status &&
            !Object.values(dropEnums_1.DropStatus).includes(updateData.status)) {
            res.status(400).json({
                success: false,
                error: `Invalid status. Must be one of: ${Object.values(dropEnums_1.DropStatus).join(", ")}`,
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
        const updatedDrop = yield Drop_1.default.findByIdAndUpdate(dropId, updateData, {
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
        if (updateData.status === dropEnums_1.DropStatus.Upcoming) {
            const updateResult = yield Item_1.default.updateMany({ drop_id: dropId }, { $set: { itemStatus: statusEnums_1.ItemStatus.Pending } });
            console.log(`Updated ${updateResult.modifiedCount} item(s) to Pending status for drop ${dropId} (status: upcoming)`);
        }
        else if (updateData.status === dropEnums_1.DropStatus.Active) {
            const updateResult = yield Item_1.default.updateMany({ drop_id: dropId }, { $set: { itemStatus: statusEnums_1.ItemStatus.Available } });
            console.log(`Updated ${updateResult.modifiedCount} item(s) to Available status for drop ${dropId} (status: active)`);
        }
        res.status(200).json({
            success: true,
            message: "Drop updated successfully",
            data: updatedDrop,
        });
    }
    catch (error) {
        console.error("Error in updateDrop:", error);
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
const deleteDrop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dropId = req.params.id;
        const { removeItems } = req.query; // Optional: removeItems=true to also remove items from drop
        // Validate drop ID
        if (!mongoose_1.default.Types.ObjectId.isValid(dropId)) {
            res.status(400).json({ success: false, error: "Invalid drop ID" });
            return;
        }
        // Check if drop exists
        const drop = yield Drop_1.default.findById(dropId);
        if (!drop) {
            res.status(404).json({ success: false, error: "Drop not found" });
            return;
        }
        // Check if drop has items
        const itemCount = yield Item_1.default.countDocuments({ drop_id: dropId });
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
            yield Item_1.default.updateMany({ drop_id: dropId }, { $unset: { drop_id: "" } });
        }
        // Delete the drop
        yield Drop_1.default.findByIdAndDelete(dropId);
        res.status(200).json({
            success: true,
            message: "Drop deleted successfully",
            data: {
                id: dropId,
                itemsRemoved: removeItems === "true" ? itemCount : 0,
            },
        });
    }
    catch (error) {
        console.error("Error in deleteDrop:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getDropItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dropId = req.params.id;
        // Validate drop ID
        if (!mongoose_1.default.Types.ObjectId.isValid(dropId)) {
            res.status(400).json({ success: false, error: "Invalid drop ID" });
            return;
        }
        // Check if drop exists
        const drop = yield Drop_1.default.findById(dropId);
        if (!drop) {
            res.status(404).json({ success: false, error: "Drop not found" });
            return;
        }
        // Get all items in this drop
        const items = yield Item_1.default.find({ drop_id: dropId });
        res.status(200).json({
            success: true,
            data: items,
            count: items.length,
        });
    }
    catch (error) {
        console.error("Error in getDropItems:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const addItemToDrop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dropId = req.params.id;
        const { itemId, itemIds } = req.body;
        // Validate drop ID
        if (!mongoose_1.default.Types.ObjectId.isValid(dropId)) {
            res.status(400).json({ success: false, error: "Invalid drop ID" });
            return;
        }
        // Check if drop exists
        const drop = yield Drop_1.default.findById(dropId);
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
        const invalidIds = itemsToAdd.filter((id) => !mongoose_1.default.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            res.status(400).json({
                success: false,
                error: `Invalid item ID(s): ${invalidIds.join(", ")}`,
            });
            return;
        }
        // Check if all items exist
        const items = yield Item_1.default.find({ _id: { $in: itemsToAdd } });
        if (items.length !== itemsToAdd.length) {
            const foundIds = items.map((item) => String(item._id));
            const notFound = itemsToAdd.filter((id) => !foundIds.includes(id));
            res.status(404).json({
                success: false,
                error: `Item(s) not found: ${notFound.join(", ")}`,
            });
            return;
        }
        // Update items to add them to the drop
        const updateData = { $set: { drop_id: dropId } };
        // Set item status based on drop status:
        // - "upcoming" → items become "pending"
        // - "active" → items become "available"
        if (drop.status === dropEnums_1.DropStatus.Upcoming) {
            updateData.$set.itemStatus = statusEnums_1.ItemStatus.Pending;
        }
        else if (drop.status === dropEnums_1.DropStatus.Active) {
            updateData.$set.itemStatus = statusEnums_1.ItemStatus.Available;
        }
        const result = yield Item_1.default.updateMany({ _id: { $in: itemsToAdd } }, updateData);
        res.status(200).json({
            success: true,
            message: `Successfully added ${result.modifiedCount} item(s) to drop`,
            data: {
                dropId,
                itemsAdded: result.modifiedCount,
                itemIds: itemsToAdd,
                itemsSetToPending: drop.status === dropEnums_1.DropStatus.Upcoming ? result.modifiedCount : 0,
                itemsSetToAvailable: drop.status === dropEnums_1.DropStatus.Active ? result.modifiedCount : 0,
            },
        });
    }
    catch (error) {
        console.error("Error in addItemToDrop:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const removeItemFromDrop = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dropId = req.params.id;
        const itemId = req.params.itemId;
        // Validate IDs
        if (!mongoose_1.default.Types.ObjectId.isValid(dropId)) {
            res.status(400).json({ success: false, error: "Invalid drop ID" });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(itemId)) {
            res.status(400).json({ success: false, error: "Invalid item ID" });
            return;
        }
        // Check if drop exists
        const drop = yield Drop_1.default.findById(dropId);
        if (!drop) {
            res.status(404).json({ success: false, error: "Drop not found" });
            return;
        }
        // Check if item exists and belongs to this drop
        const item = yield Item_1.default.findOne({ _id: itemId, drop_id: dropId });
        if (!item) {
            res.status(404).json({
                success: false,
                error: "Item not found or does not belong to this drop",
            });
            return;
        }
        // Remove item from drop (set drop_id to null)
        yield Item_1.default.updateOne({ _id: itemId }, { $unset: { drop_id: "" } });
        res.status(200).json({
            success: true,
            message: "Item successfully removed from drop",
            data: {
                dropId,
                itemId,
            },
        });
    }
    catch (error) {
        console.error("Error in removeItemFromDrop:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getDrops,
    getDropById,
    createDrop,
    updateDrop,
    deleteDrop,
    getDropItems,
    addItemToDrop,
    removeItemFromDrop,
};
