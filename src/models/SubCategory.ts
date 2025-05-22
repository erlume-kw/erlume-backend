import mongoose, { Schema } from "mongoose";
import { SubCategoryInterface } from "../interfaces/SubCategory";

const SubCategorySchema: Schema = new Schema(
	{
		sub_cat_name: { type: String, required: true },
		category_id: {
			type: Schema.Types.ObjectId,
			ref: "Category",
			required: true,
			index: true,
		},
		demand_id: {
			type: Schema.Types.ObjectId,
			ref: "Demand",
			required: true,
			index: true,
		},
		sub_clean_rate: { type: String, required: true },
	},
	{ timestamps: true },
);

const SubCategory = mongoose.model<SubCategoryInterface>(
	"SubCategory",
	SubCategorySchema,
);

export default SubCategory;
