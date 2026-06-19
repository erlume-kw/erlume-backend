import mongoose, { Schema } from "mongoose";
import { OrderInterface } from "../interfaces/Order";
import { OrderStatus } from "../enums/orderEnums";
import { DeliveryStatus } from "../enums/flowEnums";
import OrderItem from "./OrderItem";

const GuestInfoSchema = new Schema(
	{
		name: { type: String, required: true },
		phoneNumber: { type: String, required: false },
		emailAddress: { type: String, required: false },
		shippingAddress: {
			street: { type: String, required: true },
			city: { type: String, required: true },
			block: { type: String, required: true },
			governorate: { type: String, required: true },
			house: { type: String, required: true },
			flat: { type: String, required: false },
		},
	},
	{ _id: false },
);

const OrderSchema: Schema = new Schema(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: false,
			index: true,
		},
		guestInfo: { type: GuestInfoSchema, required: false },
		orderitem_ids: [
			{ type: Schema.Types.ObjectId, ref: "OrderItem", index: true },
		],
		order_status: {
			type: String,
			enum: Object.values(OrderStatus),
			required: true,
		},
		deliveryDate: { type: Date, required: false },
		deliveryStatus: {
			type: String,
			enum: Object.values(DeliveryStatus),
			required: false,
		},
		trackingReference: { type: String, required: false },
	},
	{ timestamps: true },
);

// Cascade delete OrderItems when an Order is deleted
OrderSchema.pre("findOneAndDelete", async function (next) {
	const doc = await this.model.findOne(this.getFilter());
	if (doc) {
		await OrderItem.deleteMany({ order_id: doc._id });
	}
	next();
});

const Order = mongoose.model<OrderInterface>("Order", OrderSchema);

export default Order;
