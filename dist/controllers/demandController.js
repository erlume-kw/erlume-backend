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
const Demand_1 = __importDefault(require("../models/Demand"));
const SubCategory_1 = __importDefault(require("../models/SubCategory"));
const mongoose_1 = __importDefault(require("mongoose"));
const getDemands = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const demands = yield Demand_1.default.find({});
        res.status(200).json({
            success: true,
            data: demands,
            count: demands.length,
        });
    }
    catch (error) {
        console.error("Error in getDemands:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getDemandsBySubCategoryId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subCategoryId = req.params.subCategoryId;
        // Validate subcategory ID
        if (!mongoose_1.default.Types.ObjectId.isValid(subCategoryId)) {
            res.status(400).json({ success: false, error: "Invalid subcategory ID" });
            return;
        }
        // Find subcategory to get its demand_id
        const subCategory = yield SubCategory_1.default.findById(subCategoryId);
        if (!subCategory) {
            res.status(404).json({ success: false, error: "Subcategory not found" });
            return;
        }
        // If subcategory has a demand_id, get that demand
        if (subCategory.demand_id) {
            const demand = yield Demand_1.default.findById(subCategory.demand_id);
            if (demand) {
                res.status(200).json({
                    success: true,
                    data: [demand],
                    count: 1,
                });
                return;
            }
        }
        // If no demand_id, return empty array
        res.status(200).json({
            success: true,
            data: [],
            count: 0,
            message: "Subcategory has no associated demand",
        });
    }
    catch (error) {
        console.error("Error in getDemandsBySubCategoryId:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const getDemandById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const demandId = req.params.id;
        // Validate demand ID
        if (!mongoose_1.default.Types.ObjectId.isValid(demandId)) {
            res.status(400).json({ success: false, error: "Invalid demand ID" });
            return;
        }
        // Find demand by ID
        const demand = yield Demand_1.default.findById(demandId);
        if (!demand) {
            res.status(404).json({ success: false, error: "Demand not found" });
            return;
        }
        res.status(200).json({ success: true, data: demand });
    }
    catch (error) {
        console.error("Error in getDemandById:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const createDemand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { demand_name, demand_rate } = req.body;
        // Validate required fields
        if (!demand_name) {
            res.status(400).json({
                success: false,
                error: "demand_name is required",
            });
            return;
        }
        // Create new demand
        const newDemand = new Demand_1.default({
            demand_name,
            demand_rate: demand_rate || undefined,
        });
        const savedDemand = yield newDemand.save();
        res.status(201).json({
            success: true,
            message: "Demand created successfully",
            data: savedDemand,
        });
    }
    catch (error) {
        console.error("Error in createDemand:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const updateDemand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const demandId = req.params.id;
        const updatedData = req.body;
        // Validate demand ID
        if (!mongoose_1.default.Types.ObjectId.isValid(demandId)) {
            res.status(400).json({ success: false, error: "Invalid demand ID" });
            return;
        }
        // Check if demand exists
        const demand = yield Demand_1.default.findById(demandId);
        if (!demand) {
            res.status(404).json({ success: false, error: "Demand not found" });
            return;
        }
        // Update demand
        const updatedDemand = yield Demand_1.default.findByIdAndUpdate(demandId, updatedData, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            message: "Demand updated successfully",
            data: updatedDemand,
        });
    }
    catch (error) {
        console.error("Error in updateDemand:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
const deleteDemand = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const demandId = req.params.id;
        // Validate demand ID
        if (!mongoose_1.default.Types.ObjectId.isValid(demandId)) {
            res.status(400).json({ success: false, error: "Invalid demand ID" });
            return;
        }
        // Check if demand exists
        const demand = yield Demand_1.default.findById(demandId);
        if (!demand) {
            res.status(404).json({ success: false, error: "Demand not found" });
            return;
        }
        // Delete demand
        yield Demand_1.default.findByIdAndDelete(demandId);
        res.status(200).json({
            success: true,
            message: "Demand deleted successfully",
            data: { id: demandId },
        });
    }
    catch (error) {
        console.error("Error in deleteDemand:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = {
    getDemands,
    getDemandsBySubCategoryId,
    getDemandById,
    createDemand,
    updateDemand,
    deleteDemand,
};
