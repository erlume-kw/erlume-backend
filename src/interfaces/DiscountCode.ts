import { Document } from "mongoose";

export interface DiscountCodeInterface extends Document {
	code: string; // Discount code string
	discount_percentage: string; // Discount percentage (e.g., "20" for 20%)
	expiry_date: Date; // When the discount code expires
	is_active: boolean; // Whether the code is currently active
	createdAt: Date;
	updatedAt: Date;
}
