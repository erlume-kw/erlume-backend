// src/interfaces/Item.ts

import { Document, Types } from "mongoose";
import { ItemCondition } from "../enums/itemEnums";
import { ItemStatus } from "../enums/statusEnums";
import { AuthenticationStatus, ReturnStatus } from "../enums/flowEnums";

export interface ItemInterface extends Document {
	basePrice: string; // Base price of the item
	condition: ItemCondition; // Condition of the item (enum)
	uploadedAt: Date; // Date when the item was uploaded
	saleRate: string; // Sale rate or discount percentage
	itemStatus: ItemStatus; // Status of the item (enum)
	color: string; // Color of the item
	size: string; // Size of the item
	itemName: string; // Name of the item
	itemModel?: string; // Model name (e.g., "Brick Cassette small intrecciato leather shoulder bag")
	year?: string; // Year of the item (e.g., "2024")
	quantity: string; // Quantity available
	brandName: string; // Brand name of the item
	imageUrls: string[]; // List of URLs of the item's images
	mainImageUrl?: string; // Pinned main/cover image (falls back to imageUrls[0])
	receiptPhotoUrls?: string[]; // Receipt photo URLs
	priceEstimatorUrls?: string[]; // Price estimator file URLs
	quoteUrls?: string[]; // Quote file URLs
	approved?: boolean; // Approved flag
	approvedNextDrop?: boolean; // Approved for next drop
	orderId?: Types.ObjectId; // Reference to Order
	authNeeded?: boolean; // Authentication needed
	cleaningNeeded?: boolean; // Cleaning needed
	listingPrice: string; // Listing price (KWD) — required
	photographed?: boolean; // Photographed flag
	/** Authentication result (pickup pipeline): pending | authentic | not_authentic */
	authenticationStatus?: AuthenticationStatus;
	/** When authentication was determined (optional). */
	authenticatedAt?: Date;
	/** Return date for unsold/after-sale (optional). */
	returnDate?: Date;
	/** Return status after sale / unsold (optional). */
	returnStatus?: ReturnStatus;
	seller_id?: Types.ObjectId; // Reference to seller userId
	category_id: Types.ObjectId; // Reference to Category
	sub_category_id?: Types.ObjectId; // Reference to SubCategory
	drop_id?: Types.ObjectId; // Reference to Drop (optional)
	createdAt: Date;
	updatedAt: Date;
}
