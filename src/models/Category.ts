import mongoose, { Schema } from "mongoose";
import { CategoryInterface } from "../interfaces/Category";
import SubCategory from "./SubCategory";

const CategorySchema: Schema = new Schema(
	{
		name: { type: String, required: true },
		base_rate: { type: String, required: true },
		op_rate: { type: String, required: false },
		clean_rate: { type: String, required: false },
		sub_category_id: { type: Schema.Types.ObjectId, ref: "SubCategory" }, // Optional
	},
	{ timestamps: true },
);

// Cascade delete SubCategories when a Category is deleted
CategorySchema.pre("findOneAndDelete", async function (next) {
	const doc = await this.model.findOne(this.getFilter());
	if (doc) {
		await SubCategory.deleteMany({ category_id: doc._id });
	}
	next();
});

const Category = mongoose.model<CategoryInterface>("Category", CategorySchema);

export default Category;
