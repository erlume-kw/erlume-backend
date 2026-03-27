import mongoose, { Schema } from "mongoose";
import { OrderItemInterface } from "../interfaces/OrderItem";

const OrderItemSchema: Schema = new Schema(
	{
		order_id: {
			type: Schema.Types.ObjectId,
			ref: "Order",
			required: true,
			index: true,
		},
		is_returned: { type: Boolean, required: true },
		item_id: {
			type: Schema.Types.ObjectId,
			ref: "Item",
			required: true,
			index: true,
		},
		quantity: { type: Number, required: true, min: 1 }, // Quantity ordered
		price: { type: String, required: true }, // Price at time of order (snapshot)
	},
	{ timestamps: true },
);

const OrderItem = mongoose.model<OrderItemInterface>(
	"OrderItem",
	OrderItemSchema,
);

export default OrderItem;
