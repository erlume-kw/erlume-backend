import { Document, Types } from "mongoose";
// _id = subCategory._id // This is the sub_category_id --> auto generated in mongodb

export interface ISubCategory extends Document {
	sub_cat_name: string;
	category_id: Types.ObjectId; // Reference to Category
	demand_id: Types.ObjectId; // Reference to Demand
	sub_clean_rate: string;
}
