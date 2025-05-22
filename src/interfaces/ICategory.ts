import { Document, Types } from "mongoose";
// _id = category._id // This is the category_id --> auto generated in mongodb

export interface ICategory extends Document {
	name: string;
	base_rate: string;
	op_rate: string;
	clean_rate: string;
	sub_category_id?: Types.ObjectId; // Optional: reference to a subcategory
}
