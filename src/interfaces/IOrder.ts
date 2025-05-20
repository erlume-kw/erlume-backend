import { Document, Types } from "mongoose";
import { OrderStatus } from "../enums/orderEnums";
// _id = order._id // This is the order_id --> auto generated in mongodb

export interface IOrder extends Document {
	user_id: Types.ObjectId; // Reference to User
	orderitem_ids?: Types.ObjectId[];
	order_status: OrderStatus;
}
