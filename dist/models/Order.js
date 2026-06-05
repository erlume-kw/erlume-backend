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
const orderEnums_1 = require("../enums/orderEnums");
const flowEnums_1 = require("../enums/flowEnums");
const OrderItem_1 = __importDefault(require("./OrderItem"));
const GuestInfoSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    emailAddress: { type: String, required: false },
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        block: { type: String, required: true },
        governorate: { type: String, required: true },
        house: { type: String, required: true },
        flat: { type: String, required: false },
    },
}, { _id: false });
const OrderSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        index: true,
    },
    guestInfo: { type: GuestInfoSchema, required: false },
    orderitem_ids: [
        { type: mongoose_1.Schema.Types.ObjectId, ref: "OrderItem", index: true },
    ],
    order_status: {
        type: String,
        enum: Object.values(orderEnums_1.OrderStatus),
        required: true,
    },
    deliveryDate: { type: Date, required: false },
    deliveryStatus: {
        type: String,
        enum: Object.values(flowEnums_1.DeliveryStatus),
        required: false,
    },
    trackingReference: { type: String, required: false },
}, { timestamps: true });
// Cascade delete OrderItems when an Order is deleted
OrderSchema.pre("findOneAndDelete", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield this.model.findOne(this.getFilter());
        if (doc) {
            yield OrderItem_1.default.deleteMany({ order_id: doc._id });
        }
        next();
    });
});
const Order = mongoose_1.default.model("Order", OrderSchema);
exports.default = Order;
