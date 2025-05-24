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
const mongoose_1 = __importStar(require("mongoose"));
const itemEnums_1 = require("../enums/itemEnums"); // Import the ItemCondition enum
const statusEnums_1 = require("../enums/statusEnums"); // Import the ItemStatus enum
const OutfitItem_1 = __importDefault(require("./OutfitItem"));
const OrderItem_1 = __importDefault(require("./OrderItem"));
// Create the Item schema
const ItemSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, required: true }, // Item's unique ID
    basePrice: { type: String, required: true },
    //imageId: { type: Schema.Types.ObjectId, ref: "Image", required: true }, // Foreign key reference to Image
    condition: {
        type: String,
        enum: Object.values(itemEnums_1.ItemCondition),
        required: true,
    }, // Enum for condition
    uploadedAt: { type: Date, required: true },
    saleRate: { type: String, required: true },
    itemStatus: {
        type: String,
        enum: Object.values(statusEnums_1.ItemStatus),
        required: true,
    }, // Enum for status
    color: { type: String, required: true },
    size: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: String, required: true },
    brandName: { type: String, required: true },
    imageUrls: [{ type: String, required: true }], // List of URLs of the item's images
    category_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true,
    },
    sub_category_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SubCategory",
        index: true,
    }, // Optional
}, { timestamps: true }); // Automatically manage createdAt and updatedAt
// Cascade delete OrderItems and OutfitItems when an Item is deleted
ItemSchema.pre("findOneAndDelete", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield this.model.findOne(this.getFilter());
        if (doc) {
            yield OutfitItem_1.default.deleteMany({ item_id: doc._id });
            yield OrderItem_1.default.deleteMany({ item_id: doc._id });
        }
        next();
    });
});
// Create the Item model
const Item = mongoose_1.default.model("Item", ItemSchema);
exports.default = Item;
