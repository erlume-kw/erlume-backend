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
// src/models/Seller.ts
const mongoose_1 = __importStar(require("mongoose"));
const flowEnums_1 = require("../enums/flowEnums");
const sellerEnums_1 = require("../enums/sellerEnums");
// Create the Seller schema
const SellerSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    fullName: { type: String, required: false, default: "" },
    emailAddress: {
        type: String,
        required: false,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phoneNumber: {
        type: String,
        required: false,
        match: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
    },
    addressText: { type: String, required: false, default: "" },
    balance: { type: String, required: true },
    itemIds: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: "Item",
        default: [],
    },
    IBAN: { type: String, required: false },
    qrCode: { type: String, required: false },
    isDeactivated: { type: Boolean, default: false },
    consentGiven: { type: Boolean, default: false, required: false },
    preferredPickupDate: { type: String, default: "", required: false },
    intakeTimestamp: { type: String, required: false },
    sellerPolicyAcceptedAt: { type: Date, required: false },
    escalationStatus: {
        type: String,
        enum: Object.values(flowEnums_1.EscalationStatus),
        required: false,
    },
    escalationNotes: { type: String, required: false },
    onboardingStatus: {
        type: String,
        enum: Object.values(sellerEnums_1.SellerOnboardingStatus),
        required: false,
        default: sellerEnums_1.SellerOnboardingStatus.InitialContact,
    },
    itemsOnboardingStatus: {
        type: String,
        enum: Object.values(sellerEnums_1.ItemsOnboardingStatus),
        required: false,
        default: sellerEnums_1.ItemsOnboardingStatus.NoItems,
    },
}, { timestamps: true }); // Automatically manage createdAt and updatedAt
// Create the Seller model
const Seller = mongoose_1.default.model("Seller", SellerSchema);
exports.default = Seller;
