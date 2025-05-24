import { Document, Types } from "mongoose";
// _id = orderItem._id // This is the orderitem_id --> auto generated in mongodb

export interface OrderItemInterface extends Document {
	order_id: Types.ObjectId; // Reference to Order
	is_returned: boolean;
	item_id: Types.ObjectId; // Reference to Item
	createdAt: Date;
	updatedAt: Date;
}
