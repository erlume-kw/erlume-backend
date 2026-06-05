import { Request, Response } from "express";
import mongoose from "mongoose";
import Payout from "../models/Payout";
import Seller from "../models/Seller";

const payoutController = {

	/** POST /api/payouts — create payout, deduct from seller balance */
	async create(req: Request, res: Response): Promise<void> {
		try {
			const { seller_id, amount, method, iban, notes, paid_at } = req.body;

			if (!seller_id || !amount) {
				res.status(400).json({ success: false, error: "seller_id and amount are required" });
				return;
			}

			if (!mongoose.Types.ObjectId.isValid(seller_id)) {
				res.status(400).json({ success: false, error: "Invalid seller_id" });
				return;
			}

			const payoutAmount = parseFloat(String(amount));
			if (isNaN(payoutAmount) || payoutAmount <= 0) {
				res.status(400).json({ success: false, error: "amount must be a positive number" });
				return;
			}

			const seller = await Seller.findById(seller_id);
			if (!seller) {
				res.status(404).json({ success: false, error: "Seller not found" });
				return;
			}

			const currentBalance = parseFloat(String(seller.balance)) || 0;
			if (payoutAmount > currentBalance + 0.001) {
				res.status(400).json({
					success: false,
					error: `Payout amount (${payoutAmount.toFixed(3)}) exceeds seller balance (${currentBalance.toFixed(3)})`,
				});
				return;
			}

			const resolvedMethod = ["bank_transfer", "cash", "knet", "other"].includes(method)
				? method
				: "bank_transfer";

			const payout = await Payout.create({
				seller_id,
				amount: payoutAmount.toFixed(3),
				method: resolvedMethod,
				iban: iban || seller.IBAN || undefined,
				notes: notes || undefined,
				paid_at: paid_at ? new Date(paid_at) : new Date(),
			});

			const newBalance = Math.max(0, currentBalance - payoutAmount).toFixed(3);
			await Seller.findByIdAndUpdate(seller_id, { balance: newBalance });

			res.status(201).json({
				success: true,
				message: "Payout recorded and balance updated",
				data: payout,
				newBalance,
			});
		} catch (err: any) {
			console.error("[payoutController.create]", err);
			res.status(500).json({ success: false, error: err.message || "Internal server error" });
		}
	},

	/** GET /api/payouts?seller_id= — list payouts */
	async getAll(req: Request, res: Response): Promise<void> {
		try {
			const { seller_id } = req.query;
			const filter: Record<string, unknown> = {};

			if (seller_id) {
				if (!mongoose.Types.ObjectId.isValid(seller_id as string)) {
					res.status(400).json({ success: false, error: "Invalid seller_id" });
					return;
				}
				filter.seller_id = seller_id;
			}

			const payouts = await Payout.find(filter)
				.sort({ paid_at: -1 })
				.populate("seller_id", "fullName balance IBAN")
				.lean();

			res.json({ success: true, data: payouts });
		} catch (err: any) {
			res.status(500).json({ success: false, error: err.message || "Internal server error" });
		}
	},

	/** GET /api/payouts/:id */
	async getById(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ success: false, error: "Invalid id" });
				return;
			}

			const payout = await Payout.findById(id).populate("seller_id", "fullName balance IBAN").lean();
			if (!payout) {
				res.status(404).json({ success: false, error: "Payout not found" });
				return;
			}

			res.json({ success: true, data: payout });
		} catch (err: any) {
			res.status(500).json({ success: false, error: err.message || "Internal server error" });
		}
	},

	/** PATCH /api/payouts/:id — edit amount, method, notes, paid_at */
	async update(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ success: false, error: "Invalid id" });
				return;
			}

			const payout = await Payout.findById(id);
			if (!payout) {
				res.status(404).json({ success: false, error: "Payout not found" });
				return;
			}

			const { amount, method, notes, paid_at } = req.body;
			const oldAmount = parseFloat(String(payout.amount));

			if (amount !== undefined) {
				const newAmount = parseFloat(String(amount));
				if (isNaN(newAmount) || newAmount <= 0) {
					res.status(400).json({ success: false, error: "amount must be a positive number" });
					return;
				}

				const seller = await Seller.findById(payout.seller_id);
				if (seller) {
					const currentBalance = parseFloat(String(seller.balance)) || 0;
					const restoredBalance = currentBalance + oldAmount;
					if (newAmount > restoredBalance + 0.001) {
						res.status(400).json({
							success: false,
							error: `New amount (${newAmount.toFixed(3)}) exceeds available balance (${restoredBalance.toFixed(3)})`,
						});
						return;
					}
					const newBalance = Math.max(0, restoredBalance - newAmount).toFixed(3);
					await Seller.findByIdAndUpdate(payout.seller_id, { balance: newBalance });
				}

				payout.amount = newAmount.toFixed(3) as any;
			}

			if (method && ["bank_transfer", "cash", "knet", "other"].includes(method)) {
				payout.method = method;
			}
			if (notes !== undefined) payout.notes = notes;
			if (paid_at) payout.paid_at = new Date(paid_at) as any;

			await payout.save();

			const updatedSeller = await Seller.findById(payout.seller_id).lean();
			res.json({ success: true, data: payout, newBalance: updatedSeller?.balance });
		} catch (err: any) {
			console.error("[payoutController.update]", err);
			res.status(500).json({ success: false, error: err.message || "Internal server error" });
		}
	},

	/** DELETE /api/payouts/:id — restores seller balance */
	async delete(req: Request, res: Response): Promise<void> {
		try {
			const { id } = req.params;
			if (!mongoose.Types.ObjectId.isValid(id)) {
				res.status(400).json({ success: false, error: "Invalid id" });
				return;
			}

			const payout = await Payout.findById(id);
			if (!payout) {
				res.status(404).json({ success: false, error: "Payout not found" });
				return;
			}

			const seller = await Seller.findById(payout.seller_id);
			if (seller) {
				const restored = ((parseFloat(String(seller.balance)) || 0) + parseFloat(String(payout.amount))).toFixed(3);
				await Seller.findByIdAndUpdate(seller._id, { balance: restored });
			}

			await Payout.findByIdAndDelete(id);

			res.json({ success: true, message: "Payout deleted and balance restored" });
		} catch (err: any) {
			res.status(500).json({ success: false, error: err.message || "Internal server error" });
		}
	},
};

export default payoutController;
