"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const SaleSchema = new mongoose_1.Schema({
    order_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Order",
        required: false,
        index: true,
    },
    order_item_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "OrderItem",
        required: false,
        index: true,
    },
    item_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Item",
        required: false,
        index: true,
    },
    transaction_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Transaction",
        required: false,
        index: true,
    },
    amount: { type: String, required: false }, // Total listing price (gross)
    listingPrice: { type: String, required: false },
    erlumeCommission: { type: String, required: false }, // Erlume's cut from this sale
    sellerPayout: { type: String, required: false }, // Seller's cut
    buyer: { type: String, required: false },
    status: { type: String, required: false },
    sale_date: { type: Date, required: false, index: true },
    bag_record: { type: String, required: false },
    invoice_number: { type: String, required: false },
    invoice_url: { type: String, required: false },
    payment_evidence_url: { type: String, required: false },
}, { timestamps: true });
const Sale = mongoose_1.default.model("Sale", SaleSchema);
exports.default = Sale;
