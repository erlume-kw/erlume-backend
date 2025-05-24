// src/interfaces/IItem.ts

import { Document, Types } from "mongoose";
import { ItemCondition } from "../enums/itemEnums";
import { ItemStatus } from "../enums/statusEnums";

export interface ItemInterface extends Document {
	basePrice: string; // Base price of the item
	condition: ItemCondition; // Condition of the item (enum)
	uploadedAt: Date; // Date when the item was uploaded
	saleRate: string; // Sale rate or discount percentage
	itemStatus: ItemStatus; // Status of the item (enum)
	color: string; // Color of the item
	size: string; // Size of the item
	itemName: string; // Name of the item
	quantity: string; // Quantity available
	brandName: string; // Brand name of the item
	imageUrls: string[]; // List of URLs of the item's images
	category_id: Types.ObjectId; // Reference to Category
	sub_category_id?: Types.ObjectId; // Reference to SubCategory
	createdAt: Date;
	updatedAt: Date;
}
