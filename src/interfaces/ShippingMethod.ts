// src/interfaces/ShippingMethod.ts

import { Document } from "mongoose";
import { KuwaitGovernorate } from "../enums/kuwaitEnums";

export interface ShippingMethodInterface extends Document {
	name: string;                      // e.g. "Standard Delivery", "Express Delivery"
	description?: string;              // e.g. "2–3 business days"
	price: number;                     // KWD, 0 = free
	zones: KuwaitGovernorate[];        // which governorates this applies to (empty = all)
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}
