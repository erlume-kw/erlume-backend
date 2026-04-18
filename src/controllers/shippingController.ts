// src/controllers/shippingController.ts

import { Request, Response } from "express";
import mongoose from "mongoose";
import ShippingMethod from "../models/ShippingMethod";
import { KuwaitGovernorate } from "../enums/kuwaitEnums";

/* ─── GET /api/shipping ───────────────────────────────────────────────────── */
// Public — returns all active shipping methods

const getShippingMethods = async (req: Request, res: Response): Promise<void> => {
	try {
		const methods = await ShippingMethod.find({ isActive: true }).lean();
		res.status(200).json({ success: true, data: methods, count: methods.length });
	} catch (error) {
		console.error("Error in getShippingMethods:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── GET /api/shipping/zone/:governorate ─────────────────────────────────── */
// Public — returns methods available for a specific Kuwait governorate.
// A method applies if its zones array is empty (all zones) or contains the governorate.

const getShippingByZone = async (req: Request, res: Response): Promise<void> => {
	try {
		const { governorate } = req.params;

		if (!Object.values(KuwaitGovernorate).includes(governorate as KuwaitGovernorate)) {
			res.status(400).json({
				success: false,
				error: `Invalid governorate. Must be one of: ${Object.values(KuwaitGovernorate).join(", ")}`,
			});
			return;
		}

		const methods = await ShippingMethod.find({
			isActive: true,
			$or: [
				{ zones: { $size: 0 } },      // empty = all zones
				{ zones: governorate },        // or explicitly includes this zone
			],
		}).lean();

		res.status(200).json({ success: true, data: methods, count: methods.length });
	} catch (error) {
		console.error("Error in getShippingByZone:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── GET /api/shipping/:id ───────────────────────────────────────────────── */

const getShippingMethodById = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, error: "Invalid shipping method ID" });
			return;
		}

		const method = await ShippingMethod.findById(id).lean();
		if (!method) {
			res.status(404).json({ success: false, error: "Shipping method not found" });
			return;
		}

		res.status(200).json({ success: true, data: method });
	} catch (error) {
		console.error("Error in getShippingMethodById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── POST /api/shipping ──────────────────────────────────────────────────── */
// Admin only

const createShippingMethod = async (req: Request, res: Response): Promise<void> => {
	try {
		const { name, description, price, zones, isActive } = req.body;

		if (!name || price === undefined || price === null) {
			res.status(400).json({
				success: false,
				error: "Missing required fields: name, price",
			});
			return;
		}

		if (typeof price !== "number" || price < 0) {
			res.status(400).json({ success: false, error: "price must be a non-negative number" });
			return;
		}

		// Validate zones if provided
		if (zones && Array.isArray(zones)) {
			const validGovernates = Object.values(KuwaitGovernorate);
			const invalid = zones.filter((z: string) => !validGovernates.includes(z as KuwaitGovernorate));
			if (invalid.length > 0) {
				res.status(400).json({
					success: false,
					error: `Invalid zones: ${invalid.join(", ")}. Must be Kuwait governorates.`,
				});
				return;
			}
		}

		const method = await ShippingMethod.create({
			name,
			description,
			price,
			zones: zones ?? [],
			isActive: isActive ?? true,
		});

		res.status(201).json({
			success: true,
			message: "Shipping method created",
			data: method,
		});
	} catch (error: any) {
		console.error("Error in createShippingMethod:", error);
		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((e: any) => e.message);
			res.status(400).json({ success: false, error: "Validation error", details: errors });
			return;
		}
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── PUT /api/shipping/:id ───────────────────────────────────────────────── */
// Admin only

const updateShippingMethod = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const update = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, error: "Invalid shipping method ID" });
			return;
		}

		if (update.price !== undefined && (typeof update.price !== "number" || update.price < 0)) {
			res.status(400).json({ success: false, error: "price must be a non-negative number" });
			return;
		}

		if (update.zones && Array.isArray(update.zones)) {
			const validGovernates = Object.values(KuwaitGovernorate);
			const invalid = update.zones.filter(
				(z: string) => !validGovernates.includes(z as KuwaitGovernorate),
			);
			if (invalid.length > 0) {
				res.status(400).json({
					success: false,
					error: `Invalid zones: ${invalid.join(", ")}`,
				});
				return;
			}
		}

		const method = await ShippingMethod.findByIdAndUpdate(id, update, {
			new: true,
			runValidators: true,
		});

		if (!method) {
			res.status(404).json({ success: false, error: "Shipping method not found" });
			return;
		}

		res.status(200).json({ success: true, message: "Shipping method updated", data: method });
	} catch (error: any) {
		console.error("Error in updateShippingMethod:", error);
		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((e: any) => e.message);
			res.status(400).json({ success: false, error: "Validation error", details: errors });
			return;
		}
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

/* ─── DELETE /api/shipping/:id ────────────────────────────────────────────── */
// Admin only

const deleteShippingMethod = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, error: "Invalid shipping method ID" });
			return;
		}

		const method = await ShippingMethod.findByIdAndDelete(id);
		if (!method) {
			res.status(404).json({ success: false, error: "Shipping method not found" });
			return;
		}

		res.status(200).json({ success: true, message: "Shipping method deleted" });
	} catch (error) {
		console.error("Error in deleteShippingMethod:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getShippingMethods,
	getShippingByZone,
	getShippingMethodById,
	createShippingMethod,
	updateShippingMethod,
	deleteShippingMethod,
};
