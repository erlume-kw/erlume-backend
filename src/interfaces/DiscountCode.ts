import { Document } from "mongoose";
// _id = discount._id // This is the discount_id --> auto generated in mongodb  
export interface DiscountCodeInterface extends Document {
	discount_rate: string;
	discount_code: string;
}
