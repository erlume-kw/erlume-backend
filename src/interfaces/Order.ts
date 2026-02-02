import { Document, Types } from "mongoose";
import { OrderStatus } from "../enums/orderEnums";
import { DeliveryStatus } from "../enums/flowEnums";

export interface OrderInterface extends Document {
	user_id: Types.ObjectId; // Reference to User
	orderitem_ids: Types.ObjectId[];
	order_status: OrderStatus;
	/** Optional delivery date. */
	deliveryDate?: Date;
	/** Optional delivery status (e.g. for Zoho/tracking). */
	deliveryStatus?: DeliveryStatus;
	/** Optional tracking reference. */
	trackingReference?: string;
	createdAt: Date;
	updatedAt: Date;
}
