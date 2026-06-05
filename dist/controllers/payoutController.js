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
const mongoose_1 = __importDefault(require("mongoose"));
const Payout_1 = __importDefault(require("../models/Payout"));
const Seller_1 = __importDefault(require("../models/Seller"));
const payoutController = {
    /** POST /api/payouts — create payout, deduct from seller balance */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { seller_id, amount, method, iban, notes, paid_at } = req.body;
                if (!seller_id || !amount) {
                    res.status(400).json({ success: false, error: "seller_id and amount are required" });
                    return;
                }
                if (!mongoose_1.default.Types.ObjectId.isValid(seller_id)) {
                    res.status(400).json({ success: false, error: "Invalid seller_id" });
                    return;
                }
                const payoutAmount = parseFloat(String(amount));
                if (isNaN(payoutAmount) || payoutAmount <= 0) {
                    res.status(400).json({ success: false, error: "amount must be a positive number" });
                    return;
                }
                const seller = yield Seller_1.default.findById(seller_id);
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
                const payout = yield Payout_1.default.create({
                    seller_id,
                    amount: payoutAmount.toFixed(3),
                    method: resolvedMethod,
                    iban: iban || seller.IBAN || undefined,
                    notes: notes || undefined,
                    paid_at: paid_at ? new Date(paid_at) : new Date(),
                });
                const newBalance = Math.max(0, currentBalance - payoutAmount).toFixed(3);
                yield Seller_1.default.findByIdAndUpdate(seller_id, { balance: newBalance });
                res.status(201).json({
                    success: true,
                    message: "Payout recorded and balance updated",
                    data: payout,
                    newBalance,
                });
            }
            catch (err) {
                console.error("[payoutController.create]", err);
                res.status(500).json({ success: false, error: err.message || "Internal server error" });
            }
        });
    },
    /** GET /api/payouts?seller_id= — list payouts */
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { seller_id } = req.query;
                const filter = {};
                if (seller_id) {
                    if (!mongoose_1.default.Types.ObjectId.isValid(seller_id)) {
                        res.status(400).json({ success: false, error: "Invalid seller_id" });
                        return;
                    }
                    filter.seller_id = seller_id;
                }
                const payouts = yield Payout_1.default.find(filter)
                    .sort({ paid_at: -1 })
                    .populate("seller_id", "fullName balance IBAN")
                    .lean();
                res.json({ success: true, data: payouts });
            }
            catch (err) {
                res.status(500).json({ success: false, error: err.message || "Internal server error" });
            }
        });
    },
    /** GET /api/payouts/:id */
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                    res.status(400).json({ success: false, error: "Invalid id" });
                    return;
                }
                const payout = yield Payout_1.default.findById(id).populate("seller_id", "fullName balance IBAN").lean();
                if (!payout) {
                    res.status(404).json({ success: false, error: "Payout not found" });
                    return;
                }
                res.json({ success: true, data: payout });
            }
            catch (err) {
                res.status(500).json({ success: false, error: err.message || "Internal server error" });
            }
        });
    },
    /** PATCH /api/payouts/:id — edit amount, method, notes, paid_at */
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                    res.status(400).json({ success: false, error: "Invalid id" });
                    return;
                }
                const payout = yield Payout_1.default.findById(id);
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
                    const seller = yield Seller_1.default.findById(payout.seller_id);
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
                        yield Seller_1.default.findByIdAndUpdate(payout.seller_id, { balance: newBalance });
                    }
                    payout.amount = newAmount.toFixed(3);
                }
                if (method && ["bank_transfer", "cash", "knet", "other"].includes(method)) {
                    payout.method = method;
                }
                if (notes !== undefined)
                    payout.notes = notes;
                if (paid_at)
                    payout.paid_at = new Date(paid_at);
                yield payout.save();
                const updatedSeller = yield Seller_1.default.findById(payout.seller_id).lean();
                res.json({ success: true, data: payout, newBalance: updatedSeller === null || updatedSeller === void 0 ? void 0 : updatedSeller.balance });
            }
            catch (err) {
                console.error("[payoutController.update]", err);
                res.status(500).json({ success: false, error: err.message || "Internal server error" });
            }
        });
    },
    /** DELETE /api/payouts/:id — restores seller balance */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                    res.status(400).json({ success: false, error: "Invalid id" });
                    return;
                }
                const payout = yield Payout_1.default.findById(id);
                if (!payout) {
                    res.status(404).json({ success: false, error: "Payout not found" });
                    return;
                }
                const seller = yield Seller_1.default.findById(payout.seller_id);
                if (seller) {
                    const restored = ((parseFloat(String(seller.balance)) || 0) + parseFloat(String(payout.amount))).toFixed(3);
                    yield Seller_1.default.findByIdAndUpdate(seller._id, { balance: restored });
                }
                yield Payout_1.default.findByIdAndDelete(id);
                res.json({ success: true, message: "Payout deleted and balance restored" });
            }
            catch (err) {
                res.status(500).json({ success: false, error: err.message || "Internal server error" });
            }
        });
    },
};
exports.default = payoutController;
