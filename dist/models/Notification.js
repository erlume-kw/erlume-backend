"use strict";
// src/models/Notification.ts
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
const NotificationSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    itemId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "Item",
    },
    itemName: {
        type: String,
        required: true,
    },
    brandName: {
        type: String,
        required: true,
    },
    subscribedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    verificationStatus: {
        type: String,
        enum: ["pending", "valid", "invalid"],
        default: "pending",
    },
    verifiedAt: { type: Date, default: null },
    verifialiaDiagnostics: { type: String, default: null },
}, { timestamps: true });
// Compound unique index: email + itemId (only one notification per email per item)
NotificationSchema.index({ email: 1, itemId: 1 }, { unique: true });
const Notification = mongoose_1.default.model("Notification", NotificationSchema);
exports.default = Notification;
