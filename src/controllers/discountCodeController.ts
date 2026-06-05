import { Request, Response } from "express";
import DiscountCode from "../models/DiscountCode";
import mongoose from "mongoose";

const getDiscountCodes = async (req: Request, res: Response): Promise<void> => {
	try {
		const { is_active } = req.query;

		const query: any = {};
		if (is_active !== undefined) {
			query.is_active = is_active === "true";
		}

		const discountCodes = await DiscountCode.find(query).sort({
			createdAt: -1,
		});
		res.status(200).json({
			success: true,
			data: discountCodes,
			count: discountCodes.length,
		});
	} catch (error) {
		console.error("Error in getDiscountCodes:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getDiscountCodeById = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const discountId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(discountId)) {
			res
				.status(400)
				.json({ success: false, error: "Invalid discount code ID" });
			return;
		}

		const discountCode = await DiscountCode.findById(discountId);

		if (!discountCode) {
			res
				.status(404)
				.json({ success: false, error: "Discount code not found" });
			return;
		}

		res.status(200).json({ success: true, data: discountCode });
	} catch (error) {
		console.error("Error in getDiscountCodeById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getDiscountCodeByCode = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const code = req.params.code;

		if (!code || code.trim() === "") {
			res.status(400).json({
				success: false,
				error: "Discount code is required",
			});
			return;
		}

		const discountCode = await DiscountCode.findOne({
			code: { $regex: new RegExp(`^${code}$`, "i") },
		});

		if (!discountCode) {
			res
				.status(404)
				.json({ success: false, error: "Discount code not found" });
			return;
		}

		res.status(200).json({ success: true, data: discountCode });
	} catch (error) {
		console.error("Error in getDiscountCodeByCode:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createDiscountCode = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { code, discount_percentage, expiry_date, is_active } = req.body;

		// Validate required fields
		if (!code || !discount_percentage || !expiry_date) {
			res.status(400).json({
				success: false,
				error:
					"Missing required fields: code, discount_percentage, expiry_date",
			});
			return;
		}

		// Check if discount code already exists (case-insensitive)
		const existingCode = await DiscountCode.findOne({
			code: { $regex: new RegExp(`^${code}$`, "i") },
		});

		if (existingCode) {
			res.status(400).json({
				success: false,
				error: "Discount code already exists",
			});
			return;
		}

		// Validate discount_percentage is a valid number
		const percentage = parseFloat(discount_percentage);
		if (isNaN(percentage) || percentage < 0 || percentage > 100) {
			res.status(400).json({
				success: false,
				error: "discount_percentage must be a number between 0 and 100",
			});
			return;
		}

		// Validate expiry_date is a valid date
		const expiryDateObj = new Date(expiry_date);
		if (isNaN(expiryDateObj.getTime())) {
			res.status(400).json({
				success: false,
				error: "Invalid expiry_date format",
			});
			return;
		}

		// Create discount code
		const newDiscountCode = new DiscountCode({
			code: code.toUpperCase(), // Store in uppercase
			discount_percentage,
			expiry_date: expiryDateObj,
			is_active: is_active !== undefined ? is_active : true, // Default to true
		});

		const savedDiscountCode = await newDiscountCode.save();

		res.status(201).json({
			success: true,
			message: "Discount code created successfully",
			data: savedDiscountCode,
		});
	} catch (error: any) {
		console.error("Error in createDiscountCode:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		if (error.code === 11000) {
			res.status(400).json({
				success: false,
				error: "Discount code already exists",
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const updateDiscountCode = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const discountId = req.params.id;
		const updateData = { ...req.body };

		if (!mongoose.Types.ObjectId.isValid(discountId)) {
			res
				.status(400)
				.json({ success: false, error: "Invalid discount code ID" });
			return;
		}

		const existingDiscount = await DiscountCode.findById(discountId);
		if (!existingDiscount) {
			res
				.status(404)
				.json({ success: false, error: "Discount code not found" });
			return;
		}

		// Check if discount code already exists (if updating code)
		if (updateData.code) {
			const existingCode = await DiscountCode.findOne({
				code: { $regex: new RegExp(`^${updateData.code}$`, "i") },
				_id: { $ne: discountId },
			});

			if (existingCode) {
				res.status(400).json({
					success: false,
					error: "Discount code already exists",
				});
				return;
			}

			updateData.code = updateData.code.toUpperCase();
		}

		// Validate discount_percentage if provided
		if (updateData.discount_percentage) {
			const percentage = parseFloat(updateData.discount_percentage);
			if (isNaN(percentage) || percentage < 0 || percentage > 100) {
				res.status(400).json({
					success: false,
					error: "discount_percentage must be a number between 0 and 100",
				});
				return;
			}
		}

		// Validate expiry_date if provided
		if (updateData.expiry_date) {
			const expiryDateObj = new Date(updateData.expiry_date);
			if (isNaN(expiryDateObj.getTime())) {
				res.status(400).json({
					success: false,
					error: "Invalid expiry_date format",
				});
				return;
			}
			updateData.expiry_date = expiryDateObj;
		}

		const updatedDiscount = await DiscountCode.findByIdAndUpdate(
			discountId,
			updateData,
			{ new: true, runValidators: true },
		);

		if (!updatedDiscount) {
			res
				.status(404)
				.json({ success: false, error: "Discount code not found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: "Discount code updated successfully",
			data: updatedDiscount,
		});
	} catch (error: any) {
		console.error("Error in updateDiscountCode:", error);

		if (error.name === "ValidationError") {
			const errors = Object.values(error.errors).map((err: any) => err.message);
			res.status(400).json({
				success: false,
				error: "Validation error",
				details: errors,
			});
			return;
		}

		if (error.code === 11000) {
			res.status(400).json({
				success: false,
				error: "Discount code already exists",
			});
			return;
		}

		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const deleteDiscountCode = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const discountId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(discountId)) {
			res
				.status(400)
				.json({ success: false, error: "Invalid discount code ID" });
			return;
		}

		const discountCode = await DiscountCode.findById(discountId);
		if (!discountCode) {
			res
				.status(404)
				.json({ success: false, error: "Discount code not found" });
			return;
		}

		await DiscountCode.findByIdAndDelete(discountId);

		res.status(200).json({
			success: true,
			message: "Discount code deleted successfully",
			data: { id: discountId },
		});
	} catch (error) {
		console.error("Error in deleteDiscountCode:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const validateDiscountCode = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { code, orderTotal } = req.body;

		if (!code || code.trim() === "") {
			res.status(400).json({
				success: false,
				error: "Discount code is required",
			});
			return;
		}

		const discountCode = await DiscountCode.findOne({
			code: { $regex: new RegExp(`^${code}$`, "i") },
		});

		if (!discountCode) {
			res.status(404).json({
				success: false,
				error: "Discount code not found",
				valid: false,
			});
			return;
		}

		// Check if code is active
		if (!discountCode.is_active) {
			res.status(400).json({
				success: false,
				error: "Discount code is not active",
				valid: false,
			});
			return;
		}

		// Check if code has expired
		const now = new Date();
		if (discountCode.expiry_date < now) {
			res.status(400).json({
				success: false,
				error: "Discount code has expired",
				valid: false,
			});
			return;
		}

		// Calculate discount amounts if orderTotal provided
		const percentage = parseFloat(discountCode.discount_percentage);
		let discountAmount: string | undefined;
		let finalTotal: string | undefined;

		if (orderTotal !== undefined) {
			const total = parseFloat(String(orderTotal));
			if (!isNaN(total) && total >= 0) {
				const discount = (total * percentage) / 100;
				discountAmount = discount.toFixed(3);
				finalTotal = Math.max(0, total - discount).toFixed(3);
			}
		}

		res.status(200).json({
			success: true,
			valid: true,
			discountPercentage: percentage,
			...(discountAmount !== undefined && { discountAmount }),
			...(finalTotal !== undefined && { finalTotal }),
			data: {
				_id: discountCode._id,
				code: discountCode.code,
				discount_percentage: discountCode.discount_percentage,
				expiry_date: discountCode.expiry_date,
			},
		});
	} catch (error) {
		console.error("Error in validateDiscountCode:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getDiscountCodes,
	getDiscountCodeById,
	getDiscountCodeByCode,
	createDiscountCode,
	updateDiscountCode,
	deleteDiscountCode,
	validateDiscountCode,
};
