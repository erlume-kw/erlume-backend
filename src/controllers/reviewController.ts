import { Request, Response } from "express";
import Review from "../models/Review";
import Seller from "../models/Seller";
import User from "../models/User";
import mongoose from "mongoose";
import { Stars } from "../enums/reviewEnums";

const getReviews = async (req: Request, res: Response): Promise<void> => {
	try {
		const reviews = await Review.find({})
			.populate("userId")
			.populate("sellerId");
		res.status(200).json({
			success: true,
			data: reviews,
			count: reviews.length,
		});
	} catch (error) {
		console.error("Error in getReviews:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getReviewsByProductId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const productId = req.params.productId;

		// Note: This assumes productId refers to sellerId
		// If you have a different product model, adjust accordingly
		if (!mongoose.Types.ObjectId.isValid(productId)) {
			res.status(400).json({ success: false, error: "Invalid product ID" });
			return;
		}

		const reviews = await Review.find({ sellerId: productId })
			.populate("userId")
			.populate("sellerId");

		res.status(200).json({
			success: true,
			data: reviews,
			count: reviews.length,
		});
	} catch (error) {
		console.error("Error in getReviewsByProductId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getReviewsBySellerId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const sellerId = req.params.userId; // Note: param is userId but refers to seller

		if (!mongoose.Types.ObjectId.isValid(sellerId)) {
			res.status(400).json({ success: false, error: "Invalid seller ID" });
			return;
		}

		const seller = await Seller.findById(sellerId);
		if (!seller) {
			res.status(404).json({ success: false, error: "Seller not found" });
			return;
		}

		const reviews = await Review.find({ sellerId })
			.populate("userId")
			.populate("sellerId");

		res.status(200).json({
			success: true,
			data: reviews,
			count: reviews.length,
		});
	} catch (error) {
		console.error("Error in getReviewsBySellerId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getReviewById = async (req: Request, res: Response): Promise<void> => {
	try {
		const reviewId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(reviewId)) {
			res.status(400).json({ success: false, error: "Invalid review ID" });
			return;
		}

		const review = await Review.findById(reviewId)
			.populate("userId")
			.populate("sellerId");

		if (!review) {
			res.status(404).json({ success: false, error: "Review not found" });
			return;
		}

		res.status(200).json({ success: true, data: review });
	} catch (error) {
		console.error("Error in getReviewById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createReview = async (req: Request, res: Response): Promise<void> => {
	try {
		const { userId, sellerId, rating, description } = req.body;

		// Validate required fields
		if (!sellerId || !rating || !description) {
			res.status(400).json({
				success: false,
				error: "Missing required fields: sellerId, rating, description",
			});
			return;
		}

		// Validate sellerId
		if (!mongoose.Types.ObjectId.isValid(sellerId)) {
			res.status(400).json({ success: false, error: "Invalid seller ID" });
			return;
		}

		const seller = await Seller.findById(sellerId);
		if (!seller) {
			res.status(404).json({ success: false, error: "Seller not found" });
			return;
		}

		// Validate userId if provided
		if (userId) {
			if (!mongoose.Types.ObjectId.isValid(userId)) {
				res.status(400).json({ success: false, error: "Invalid user ID" });
				return;
			}

			const user = await User.findById(userId);
			if (!user) {
				res.status(404).json({ success: false, error: "User not found" });
				return;
			}
		}

		// Validate rating enum
		if (!Object.values(Stars).includes(rating)) {
			res.status(400).json({
				success: false,
				error: `Invalid rating. Must be one of: ${Object.values(Stars).join(
					", ",
				)}`,
			});
			return;
		}

		// Create review
		const newReview = new Review({
			userId,
			sellerId,
			rating,
			description,
		});

		const savedReview = await newReview.save();

		res.status(201).json({
			success: true,
			message: "Review created successfully",
			data: savedReview,
		});
	} catch (error: any) {
		console.error("Error in createReview:", error);

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

const updateReview = async (req: Request, res: Response): Promise<void> => {
	try {
		const reviewId = req.params.id;
		const updateData = { ...req.body };

		if (!mongoose.Types.ObjectId.isValid(reviewId)) {
			res.status(400).json({ success: false, error: "Invalid review ID" });
			return;
		}

		const existingReview = await Review.findById(reviewId);
		if (!existingReview) {
			res.status(404).json({ success: false, error: "Review not found" });
			return;
		}

		// Validate rating if provided
		if (
			updateData.rating &&
			!Object.values(Stars).includes(updateData.rating)
		) {
			res.status(400).json({
				success: false,
				error: `Invalid rating. Must be one of: ${Object.values(Stars).join(
					", ",
				)}`,
			});
			return;
		}

		// Validate sellerId if provided
		if (updateData.sellerId) {
			if (!mongoose.Types.ObjectId.isValid(updateData.sellerId)) {
				res.status(400).json({ success: false, error: "Invalid seller ID" });
				return;
			}

			const seller = await Seller.findById(updateData.sellerId);
			if (!seller) {
				res.status(404).json({ success: false, error: "Seller not found" });
				return;
			}
		}

		// Validate userId if provided
		if (updateData.userId !== undefined) {
			if (updateData.userId === null || updateData.userId === "") {
				updateData.userId = undefined; // Allow clearing userId
			} else {
				if (!mongoose.Types.ObjectId.isValid(updateData.userId)) {
					res.status(400).json({ success: false, error: "Invalid user ID" });
					return;
				}

				const user = await User.findById(updateData.userId);
				if (!user) {
					res.status(404).json({ success: false, error: "User not found" });
					return;
				}
			}
		}

		const updatedReview = await Review.findByIdAndUpdate(reviewId, updateData, {
			new: true,
			runValidators: true,
		});

		if (!updatedReview) {
			res.status(404).json({ success: false, error: "Review not found" });
			return;
		}

		res.status(200).json({
			success: true,
			message: "Review updated successfully",
			data: updatedReview,
		});
	} catch (error: any) {
		console.error("Error in updateReview:", error);

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

const deleteReview = async (req: Request, res: Response): Promise<void> => {
	try {
		const reviewId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(reviewId)) {
			res.status(400).json({ success: false, error: "Invalid review ID" });
			return;
		}

		const review = await Review.findById(reviewId);
		if (!review) {
			res.status(404).json({ success: false, error: "Review not found" });
			return;
		}

		await Review.findByIdAndDelete(reviewId);

		res.status(200).json({
			success: true,
			message: "Review deleted successfully",
			data: { id: reviewId },
		});
	} catch (error) {
		console.error("Error in deleteReview:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getReviews,
	getReviewsByProductId,
	getReviewsBySellerId,
	getReviewById,
	createReview,
	updateReview,
	deleteReview,
};
