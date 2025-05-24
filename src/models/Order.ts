import mongoose, { Schema } from "mongoose";
import { OrderInterface } from "../interfaces/Order";
import { OrderStatus } from "../enums/orderEnums";
import OrderItem from "./OrderItem";

const OrderSchema: Schema = new Schema(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		orderitem_ids: [
			{ type: Schema.Types.ObjectId, ref: "OrderItem", index: true },
		],
		order_status: {
			type: String,
			enum: Object.values(OrderStatus),
			required: true,
		},
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
