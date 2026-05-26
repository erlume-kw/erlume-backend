import { Request, Response } from "express";
import CreditCard from "../models/CreditCard";
import User from "../models/User";
import mongoose from "mongoose";
import { assertSelfOrAdmin } from "../utils/rls";

const getCreditCards = async (req: Request, res: Response): Promise<void> => {
	try {
		const creditCards = await CreditCard.find({});
		res.status(200).json({
			success: true,
			data: creditCards,
			count: creditCards.length,
		});
	} catch (error) {
		console.error("Error in getCreditCards:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getCreditCardsByUserId = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const userId = req.params.userId;

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			res.status(400).json({ success: false, error: "Invalid user ID" });
			return;
		}

		if (!assertSelfOrAdmin(req, res, userId)) return;

		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ success: false, error: "User not found" });
			return;
		}

		// Get credit cards from user's cardIds array
		const creditCards = await CreditCard.find({
			_id: { $in: user.cardIds || [] },
		});

		res.status(200).json({
			success: true,
			data: creditCards,
			count: creditCards.length,
		});
	} catch (error) {
		console.error("Error in getCreditCardsByUserId:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const getCreditCardById = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const cardId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(cardId)) {
			res.status(400).json({ success: false, error: "Invalid credit card ID" });
			return;
		}

		const creditCard = await CreditCard.findById(cardId);

		if (!creditCard) {
			res.status(404).json({ success: false, error: "Credit card not found" });
			return;
		}

		// Verify the card belongs to the requesting user (admins bypass)
		const owner = await User.findOne({ cardIds: cardId });
		if (!assertSelfOrAdmin(req, res, String(owner?._id))) return;

		// Mask card number for security (show only last 4 digits)
		const maskedCard = {
			...creditCard.toObject(),
			cardNumber: `****-****-****-${creditCard.cardNumber.slice(-4)}`,
		};

		res.status(200).json({ success: true, data: maskedCard });
	} catch (error) {
		console.error("Error in getCreditCardById:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

const createCreditCard = async (
	req: Request,
	res: Response,
): Promise<void> => {
	try {
		const { cardNumber, expiryDate, holderName, userId } = req.body;

		// Validate required fields
		if (!cardNumber || !expiryDate || !holderName || !userId) {
			res.status(400).json({
				success: false,
				error: "Missing required fields: cardNumber, expiryDate, holderName, userId",
			});
			return;
		}

		// Validate userId
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			res.status(400).json({ success: false, error: "Invalid user ID" });
			return;
		}

		if (!assertSelfOrAdmin(req, res, userId)) return;

		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ success: false, error: "User not found" });
			return;
		}

		// Validate card number format (basic validation)
		const cleanedCardNumber = cardNumber.replace(/\s+/g, "").replace(/-/g, "");
		if (!/^\d{13,19}$/.test(cleanedCardNumber)) {
			res.status(400).json({
				success: false,
				error: "Invalid card number format",
			});
			return;
		}

		// Create credit card
		const newCreditCard = new CreditCard({
			cardNumber: cleanedCardNumber,
			expiryDate,
			holderName,
		});

		const savedCreditCard = await newCreditCard.save();

		// Add card ID to user's cardIds array
		if (!user.cardIds) {
			user.cardIds = [];
		}
		user.cardIds.push(savedCreditCard._id as any);
		await user.save();

		// Mask card number in response
		const maskedCard = {
			...savedCreditCard.toObject(),
			cardNumber: `****-****-****-${savedCreditCard.cardNumber.slice(-4)}`,
		};

		res.status(201).json({
			success: true,
			message: "Credit card created successfully",
			data: maskedCard,
		});
	} catch (error: any) {
		console.error("Error in createCreditCard:", error);

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

const updateCreditCard = async (req: Request, res: Response): Promise<void> => {
	try {
		const cardId = req.params.id;
		const updateData = { ...req.body };

		if (!mongoose.Types.ObjectId.isValid(cardId)) {
			res.status(400).json({ success: false, error: "Invalid credit card ID" });
			return;
		}

		const existingCard = await CreditCard.findById(cardId);
		if (!existingCard) {
			res.status(404).json({ success: false, error: "Credit card not found" });
			return;
		}

		const owner = await User.findOne({ cardIds: cardId });
		if (!assertSelfOrAdmin(req, res, String(owner?._id))) return;

		// Validate card number format if provided
		if (updateData.cardNumber) {
			const cleanedCardNumber = updateData.cardNumber
				.replace(/\s+/g, "")
				.replace(/-/g, "");
			if (!/^\d{13,19}$/.test(cleanedCardNumber)) {
				res.status(400).json({
					success: false,
					error: "Invalid card number format",
				});
				return;
			}
			updateData.cardNumber = cleanedCardNumber;
		}

		const updatedCard = await CreditCard.findByIdAndUpdate(
			cardId,
			updateData,
			{ new: true, runValidators: true },
		);

		if (!updatedCard) {
			res.status(404).json({ success: false, error: "Credit card not found" });
			return;
		}

		// Mask card number in response
		const maskedCard = {
			...updatedCard.toObject(),
			cardNumber: `****-****-****-${updatedCard.cardNumber.slice(-4)}`,
		};

		res.status(200).json({
			success: true,
			message: "Credit card updated successfully",
			data: maskedCard,
		});
	} catch (error: any) {
		console.error("Error in updateCreditCard:", error);

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

const deleteCreditCard = async (req: Request, res: Response): Promise<void> => {
	try {
		const cardId = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(cardId)) {
			res.status(400).json({ success: false, error: "Invalid credit card ID" });
			return;
		}

		const creditCard = await CreditCard.findById(cardId);
		if (!creditCard) {
			res.status(404).json({ success: false, error: "Credit card not found" });
			return;
		}

		const owner = await User.findOne({ cardIds: cardId });
		if (!assertSelfOrAdmin(req, res, String(owner?._id))) return;

		// Remove card ID from all users' cardIds arrays
		await User.updateMany(
			{ cardIds: cardId },
			{ $pull: { cardIds: cardId as any } },
		);

		// Delete the credit card
		await CreditCard.findByIdAndDelete(cardId);

		res.status(200).json({
			success: true,
			message: "Credit card deleted successfully",
			data: { id: cardId },
		});
	} catch (error) {
		console.error("Error in deleteCreditCard:", error);
		res.status(500).json({ success: false, error: "Internal server error" });
	}
};

export default {
	getCreditCards,
	getCreditCardsByUserId,
	getCreditCardById,
	createCreditCard,
	updateCreditCard,
	deleteCreditCard,
};
