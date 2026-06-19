import { z } from "zod";
import { ItemCondition } from "../enums/itemEnums";
import { ItemStatus } from "../enums/statusEnums";
import { AuthenticationStatus, ReturnStatus, DeliveryStatus, EscalationStatus } from "../enums/flowEnums";
import { SellerOnboardingStatus, ItemsOnboardingStatus } from "../enums/sellerEnums";
import { OrderStatus } from "../enums/orderEnums";
import { UserRole } from "../enums/userEnums";
import { PaymentMethod } from "../enums/paymentEnums";
import { TransactionStatus } from "../enums/transactionEnums";
import { DropStatus } from "../enums/dropEnums";
import { Stars } from "../enums/reviewEnums";

// MongoDB ObjectId validation helper
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

// Date validation - accepts ISO string or Date object
const dateSchema = z.union([
	z.string().datetime(),
	z.string().regex(/^\d{4}-\d{2}-\d{2}/), // YYYY-MM-DD format
	z.date(),
]).transform((val) => (typeof val === "string" ? new Date(val) : val));

// Address schema
export const addressSchema = z.object({
	street: z.string().min(1, "Street is required"),
	city: z.string().min(1, "City is required"),
	block: z.string().min(1, "Block is required"),
	governorate: z.string().min(1, "Governorate is required"),
	house: z.string().min(1, "House number is required"),
	flat: z.string().optional(),
}).strict(); // Don't allow extra fields

// ==================== USER SCHEMAS ====================
export const createUserSchema = z.object({
	password: z.string().min(6, "Password must be at least 6 characters"),
	emailAddress: z.string().email("Invalid email address"),
	phoneNumber: z.string().regex(/^[+]?[\s\-]?[0-9]{7,15}$/, "Invalid phone number format"),
	address: addressSchema,
	roles: z.array(z.nativeEnum(UserRole)).optional().default([UserRole.USER]),
	consentGiven: z.union([z.boolean(), z.string()]).optional(),
	preferredPickupDate: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
	password: z.string().min(6).optional(),
	roles: z.array(z.nativeEnum(UserRole)).optional(),
	isDeleted: z.boolean().optional(), // Allow soft delete via PATCH
});

export const updateUserRolesSchema = z.object({
	roles: z.array(z.nativeEnum(UserRole)).min(1, "At least one role is required"),
});

// ==================== ITEM SCHEMAS ====================
// Base item schema without refinements (for use with .partial())
const baseItemSchema = z.object({
	basePrice: z.string().min(1, "Base price is required"),
	condition: z.nativeEnum(ItemCondition),
	uploadedAt: dateSchema,
	saleRate: z.string().min(1, "Sale rate is required"),
	itemStatus: z.nativeEnum(ItemStatus),
	color: z.string().min(1, "Color is required"),
	size: z.string().min(1, "Size is required"),
	itemName: z.string().optional(),
	bag: z.string().optional(), // Legacy field name
	itemModel: z.string().optional(),
	year: z.string().optional(),
	quantity: z.string().min(1, "Quantity is required"),
	brandName: z.string().min(1, "Brand name is required"),
	imageUrls: z.array(z.string().url("Invalid image URL")).optional(),
	photoUrls: z.array(z.string().url("Invalid photo URL")).optional(), // Legacy field name
	receiptPhotoUrls: z.array(z.string().url("Invalid receipt photo URL")).optional(),
	priceEstimatorUrls: z.array(z.string().url("Invalid price estimator URL")).optional(),
	quoteUrls: z.array(z.string().url("Invalid quote URL")).optional(),
	approved: z.boolean().optional(),
	approvedNextDrop: z.boolean().optional(),
	orderId: objectIdSchema.optional(),
	authNeeded: z.boolean().optional(),
	cleaningNeeded: z.boolean().optional(),
	listingPrice: z.string().min(1, "Listing price is required"),
	photographed: z.boolean().optional(),
	authenticationStatus: z.nativeEnum(AuthenticationStatus).optional(),
	authenticatedAt: dateSchema.optional(),
	returnDate: dateSchema.optional(),
	returnStatus: z.nativeEnum(ReturnStatus).optional(),
	seller_id: objectIdSchema.optional(),
	category_id: objectIdSchema,
	sub_category_id: objectIdSchema.optional(),
	drop_id: objectIdSchema.optional(),
});

// Create schema with refinements
export const createItemSchema = baseItemSchema.refine(
	(data) => {
		const imageUrlsArray = data.imageUrls || [];
		const photoUrlsArray = data.photoUrls || [];
		const allImages = [...imageUrlsArray, ...photoUrlsArray];
		return allImages.length > 0;
	},
	{
		message: "At least one image URL is required (imageUrls or photoUrls)",
		path: ["imageUrls"],
	}
).refine(
	(data) => data.itemName || data.bag,
	{
		message: "Either itemName or bag must be provided",
		path: ["itemName"],
	}
);

/**
 * PATCH/PUT bodies often come from spreading a GET response: `sellerId` vs `seller_id`,
 * `null` for cleared refs (Zod `.optional()` does not accept `null`), numbers for string
 * fields, and Mongo read-only keys. Normalize before validating.
 */
function preprocessItemUpdateBody(val: unknown): unknown {
	if (val === null || typeof val !== "object" || Array.isArray(val)) {
		return val;
	}
	const o = { ...(val as Record<string, unknown>) };

	// API exposes sellerId; model uses seller_id
	if ("sellerId" in o && !("seller_id" in o)) {
		o.seller_id = o.sellerId;
	}
	delete o.sellerId;

	for (const k of ["_id", "__v", "createdAt", "updatedAt", "id"] as const) {
		delete o[k];
	}

	// Optional fields: null is invalid for Zod `.optional()` on strings — omit only where
	// "missing" means skip update. Refs (seller_id, drop_id, …) keep null so the controller
	// can clear associations; enums/dates omit null so we do not send invalid null into enums.
	for (const k of [
		"authenticatedAt",
		"returnDate",
		"authenticationStatus",
		"returnStatus",
	] as const) {
		if (o[k] === null) {
			delete o[k];
		}
	}

	for (const k of [
		"basePrice",
		"saleRate",
		"quantity",
		"listingPrice",
		"brandName",
		"color",
		"size",
	] as const) {
		if (typeof o[k] === "number") {
			o[k] = String(o[k]);
		}
	}

	return o;
}

// Update: allow non-URL image strings (relative paths / CDN) — create still uses .url()
const itemUpdateImageArray = z.array(z.string().min(1, "Image URL cannot be empty")).optional();

// Update schema without create-only refinements
const optionalObjectIdOrClear = z
	.union([
		objectIdSchema,
		z.null(),
		z.literal(""),
	])
	.optional();

export const updateItemSchema = z.preprocess(
	preprocessItemUpdateBody,
	baseItemSchema
		.partial()
		.extend({
			listingPrice: z
				.union([
					z.string().min(1, "Listing price cannot be empty"),
					z.number().transform((n) => String(n)),
				])
				.optional(),
			seller_id: optionalObjectIdOrClear,
			drop_id: optionalObjectIdOrClear,
			sub_category_id: optionalObjectIdOrClear,
			orderId: optionalObjectIdOrClear,
			imageUrls: itemUpdateImageArray,
			photoUrls: itemUpdateImageArray,
			receiptPhotoUrls: itemUpdateImageArray,
			priceEstimatorUrls: itemUpdateImageArray,
			quoteUrls: itemUpdateImageArray,
			mainImageUrl: z.string().url("mainImageUrl must be a valid URL").optional(),
		}),
);

// ==================== ORDER SCHEMAS ====================
const orderItemsSchema = z.array(z.object({
	item_id: objectIdSchema,
	quantity: z.number().int().min(1).optional(),
	is_returned: z.boolean().optional(),
})).min(1, "At least one order item is required");

const guestInfoSchema = z.object({
	name: z.string().min(1, "Name is required"),
	phoneNumber: z.string().regex(/^[+]?[\s\-]?[0-9]{7,15}$/, "Invalid phone number format"),
	emailAddress: z.string().email("Invalid email address").optional(),
	shippingAddress: addressSchema,
});

// Registered user path
const registeredOrderSchema = z.object({
	user_id: objectIdSchema,
	guestInfo: z.undefined().optional(),
	orderItems: orderItemsSchema,
	order_status: z.nativeEnum(OrderStatus).optional(),
});

// Guest path
const guestOrderSchema = z.object({
	user_id: z.undefined().optional(),
	guestInfo: guestInfoSchema,
	orderItems: orderItemsSchema,
	order_status: z.nativeEnum(OrderStatus).optional(),
});

export const createOrderSchema = z.union([registeredOrderSchema, guestOrderSchema]);

export const updateOrderSchema = z.object({
	order_status: z.nativeEnum(OrderStatus).optional(),
	deliveryDate: dateSchema.optional(),
	deliveryStatus: z.nativeEnum(DeliveryStatus).optional(),
	trackingReference: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
	order_status: z.nativeEnum(OrderStatus),
});

// ==================== ORDER ITEM SCHEMAS ====================
export const createOrderItemSchema = z.object({
	order_id: objectIdSchema,
	is_returned: z.boolean(),
	item_id: objectIdSchema,
	quantity: z.number().int().min(1, "Quantity must be at least 1"),
	price: z.string().min(1, "Price is required"),
});

export const updateOrderItemSchema = createOrderItemSchema.partial();

// ==================== SELLER SCHEMAS ====================
export const createSellerSchema = z.object({
	userId: objectIdSchema,
	fullName: z.string().optional(),
	emailAddress: z.string().email("Invalid email address").optional(),
	phoneNumber: z.string().regex(/^[+]?[\s\-]?[0-9]{7,15}$/).optional(),
	addressText: z.string().optional(),
	balance: z.string().min(1, "Balance is required"),
	itemIds: z.array(objectIdSchema).optional(),
	IBAN: z.string().optional(),
	qrCode: z.string().optional(),
	isDeactivated: z.boolean().optional(),
	consentGiven: z.boolean().optional(),
	preferredPickupDate: z.string().optional(),
	intakeTimestamp: z.string().optional(),
	sellerPolicyAcceptedAt: dateSchema.optional(),
	escalationStatus: z.nativeEnum(EscalationStatus).optional(),
	escalationNotes: z.string().optional(),
});

export const updateSellerSchema = z.object({
	fullName: z.string().optional(),
	emailAddress: z.string().email("Invalid email address").optional(),
	phoneNumber: z.string().regex(/^[+]?[\s\-]?[0-9]{7,15}$/).optional(),
	addressText: z.string().optional(),
	balance: z.string().optional(),
	IBAN: z.string().optional(),
	qrCode: z.string().optional(),
	isDeactivated: z.boolean().optional(),
	consentGiven: z.union([z.boolean(), z.string()]).optional(),
	preferredPickupDate: z.string().optional(),
	intakeTimestamp: z.string().optional(),
	sellerPolicyAcceptedAt: dateSchema.optional(),
	escalationStatus: z.nativeEnum(EscalationStatus).optional(),
	escalationNotes: z.string().optional(),
	onboardingStatus: z.nativeEnum(SellerOnboardingStatus).optional(),
	itemsOnboardingStatus: z.nativeEnum(ItemsOnboardingStatus).optional(),
});

// ==================== CATEGORY SCHEMAS ====================
export const createCategorySchema = z.object({
	name: z.string().min(1, "Category name is required"),
	base_rate: z.number().transform((val) => String(val)),
	op_rate: z.number().optional().transform((val) => val !== undefined ? String(val) : undefined),
	clean_rate: z.number().optional().transform((val) => val !== undefined ? String(val) : undefined),
	sub_category_id: objectIdSchema.optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ==================== SUB CATEGORY SCHEMAS ====================
export const createSubCategorySchema = z.object({
	sub_cat_name: z.string().min(1, "Sub category name is required"),
	category_id: objectIdSchema,
	demand_id: objectIdSchema.optional(),
	sub_clean_rate: z.number().optional().transform((val) => val !== undefined ? String(val) : undefined),
});

export const updateSubCategorySchema = createSubCategorySchema.partial();

// ==================== DEMAND SCHEMAS ====================
export const createDemandSchema = z.object({
	demand_name: z.string().min(1, "Demand name is required"),
	demand_rate: z.number().optional().transform((val) => val !== undefined ? String(val) : undefined),
});

export const updateDemandSchema = createDemandSchema.partial();

// ==================== DROP SCHEMAS ====================
export const createDropSchema = z.object({
	name: z.string().min(1, "Drop name is required"),
	description: z.string().optional(),
	releaseDate: dateSchema,
	status: z.nativeEnum(DropStatus),
	bannerImageUrl: z.string().url("Invalid banner image URL").optional(),
});

export const updateDropSchema = createDropSchema.partial();

// ==================== REVIEW SCHEMAS ====================
export const createReviewSchema = z.object({
	userId: objectIdSchema.optional(),
	sellerId: objectIdSchema,
	rating: z.number().int().min(1).max(5).or(z.nativeEnum(Stars)),
	description: z.string().min(1, "Description is required"),
});

export const updateReviewSchema = createReviewSchema.partial();

// ==================== TRANSACTION SCHEMAS ====================
export const createTransactionSchema = z.object({
	order_id: objectIdSchema,
	discount_rate: z.string().min(1, "Discount rate is required"),
	amount: z.string().min(1, "Amount is required"),
	discount_id: objectIdSchema.optional(),
	status: z.nativeEnum(TransactionStatus),
	paymentMethod: z.nativeEnum(PaymentMethod).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// ==================== SALE SCHEMAS ====================
export const createSaleSchema = z.object({
	order_id: objectIdSchema.optional(),
	order_item_id: objectIdSchema.optional(),
	item_id: objectIdSchema.optional(),
	transaction_id: objectIdSchema.optional(),
	amount: z.string().optional(),
	listingPrice: z.string().optional(),
	erlumeCommission: z.string().optional(),
	sellerPayout: z.string().optional(),
	buyer: z.string().optional(),
	status: z.string().optional(),
	sale_date: dateSchema.optional(),
	bag_record: z.string().optional(),
	invoice_number: z.string().optional(),
	invoice_url: z.string().url("Invalid invoice URL").optional(),
	payment_evidence_url: z.string().url("Invalid payment evidence URL").optional(),
});

export const updateSaleSchema = createSaleSchema.partial();

/** POST /api/sales/recalculate-commissions — no body fields; empty JSON only */
export const recalculateSaleCommissionsBodySchema = z.preprocess(
	(val) => (val === undefined || val === null ? {} : val),
	z.object({}).strict(),
);

// ==================== INCOME SCHEMAS ====================
export const createIncomeSchema = z.object({
	order_id: objectIdSchema.optional(),
	order_item_id: objectIdSchema.optional(),
	item_id: objectIdSchema.optional(),
	seller_id: objectIdSchema.optional(),
	amount: z.string().min(1, "Amount is required"),
	erlumeCommissionAmount: z.string().optional(),
	sellerPayoutAmount: z.string().optional(),
	currency: z.string().default("KWD"),
	platform: z.string().optional(),
	income_type: z.string().default("sale"),
	received_at: dateSchema.optional(),
	month: dateSchema.optional(),
	prelaunch_bag: z.string().optional(),
	notes: z.string().optional(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

// ==================== EXPENSE SCHEMAS ====================
export const createExpenseSchema = z.object({
	name: z.string().min(1, "Expense name is required"),
	cost: z.string().min(1, "Cost is required"),
	currency: z.string().default("KWD"),
	employee_id: objectIdSchema.optional(),
	notes: z.string().optional(),
	type: z.array(z.string()).min(1, "At least one expense type is required"),
	month: dateSchema,
	paidBy: z.string().optional(),
	isRecurring: z.boolean().optional(),
	phase: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// ==================== DISCOUNT CODE SCHEMAS ====================
export const createDiscountCodeSchema = z.object({
	code: z.string().min(1, "Discount code is required").transform((val) => val.toUpperCase()),
	discount_percentage: z.number()
		.min(0, "Discount percentage must be at least 0")
		.max(100, "Discount percentage must be at most 100")
		.transform((val) => String(val)),
	expiry_date: dateSchema,
	is_active: z.boolean().default(true),
});

export const updateDiscountCodeSchema = createDiscountCodeSchema.partial();

export const validateDiscountCodeSchema = z.object({
	code: z.string().min(1, "Discount code is required"),
	orderTotal: z.string().optional(),
});

// ==================== CREDIT CARD SCHEMAS ====================
export const createCreditCardSchema = z.object({
	cardNumber: z.string().min(1, "Card number is required"),
	expiryDate: z.string().min(1, "Expiry date is required"),
	holderName: z.string().min(1, "Cardholder name is required"),
});

export const updateCreditCardSchema = createCreditCardSchema.partial();

// ==================== OUTFIT SCHEMAS ====================
export const createOutfitSchema = z.object({
	item_ids: z.array(objectIdSchema).min(1, "At least one item ID is required"),
	outfit_title: z.string().min(1, "Outfit title is required"),
	outfit_tags: z.string().min(1, "Outfit tags is required"),
	coverImageUrl: z.string().url("Invalid cover image URL").optional(),
});

export const updateOutfitSchema = createOutfitSchema.partial();

// ==================== OUTFIT ITEM SCHEMAS ====================
export const createOutfitItemSchema = z.object({
	item_id: objectIdSchema,
	outfit_id: objectIdSchema,
	featured_in_product: z.boolean(),
});

export const updateOutfitItemSchema = createOutfitItemSchema.partial();

/** PATCH /api/outfititems/:id/featured — optional `featured` toggles; omit to flip */
export const toggleOutfitItemFeaturedBodySchema = z.preprocess(
	(val) => (val === undefined || val === null ? {} : val),
	z.object({ featured: z.boolean().optional() }).strict(),
);

// ==================== EMPLOYEE SCHEMAS ====================
export const createEmployeeSchema = z.object({
	name: z.string().min(1, "Employee name is required"),
	photo: z.string().url("Invalid photo URL").optional(),
	role: z.string().optional(),
	type: z.string().optional(),
	salaryActual: z.string().optional(),
	salaryProjected: z.string().optional(),
	user_id: objectIdSchema.optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// ==================== PARAM VALIDATION SCHEMAS ====================
export const idParamSchema = z.object({
	id: objectIdSchema,
});

export const orderIdParamSchema = z.object({
	orderId: objectIdSchema,
});

export const userIdParamSchema = z.object({
	userId: objectIdSchema,
});

export const sellerIdParamSchema = z.object({
	sellerId: objectIdSchema,
});

export const codeParamSchema = z.object({
	code: z.string().min(1, "Code is required"),
});

export const categoryParamSchema = z.object({
	category: z.string().min(1, "Category is required"),
});

export const dropItemParamsSchema = z.object({
	id: objectIdSchema,
	itemId: objectIdSchema,
});

// ==================== QUERY VALIDATION SCHEMAS ====================
// All query schemas should allow empty queries and make all fields optional
// Using passthrough() to allow additional query params that aren't in the schema
export const paginationQuerySchema = z.object({
	limit: z.string().regex(/^\d+$/).transform(Number).optional(),
	skip: z.string().regex(/^\d+$/).transform(Number).optional(),
	page: z.string().regex(/^\d+$/).transform(Number).optional(),
}).passthrough(); // Allow additional query params

export const dateFilterQuerySchema = z.object({
	year: z.string().regex(/^\d{4}$/).transform(Number).optional(),
	month: z.string().regex(/^(0?[1-9]|1[0-2])$/).transform(Number).optional(),
}).passthrough(); // Allow additional query params

export const itemFilterQuerySchema = z.object({
	itemStatus: z.nativeEnum(ItemStatus).optional(),
	condition: z.nativeEnum(ItemCondition).optional(),
	category_id: objectIdSchema.optional(),
	sub_category_id: objectIdSchema.optional(),
	drop_id: objectIdSchema.optional(),
	seller_id: objectIdSchema.optional(),
	brandName: z.string().optional(),
	search: z.string().optional(),
	minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
	maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
	page: z.string().regex(/^\d+$/).transform(Number).optional(),
	limit: z.string().regex(/^\d+$/).transform(Number).optional(),
}).passthrough();

export const userFilterQuerySchema = z.object({
	includeDeleted: z.enum(["true", "false"]).optional(),
	role: z.string().optional(),
}).passthrough(); // Allow additional query params

// Export TypeScript types for use in controllers and frontend
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;
export type ValidateDiscountCodeInput = z.infer<typeof validateDiscountCodeSchema>;

// ==================== AUTH SCHEMAS ====================
export const loginSchema = z.object({
	emailAddress: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
	password: z.string().min(6, "Password must be at least 6 characters"),
	emailAddress: z.string().email("Invalid email address"),
	phoneNumber: z.string().regex(/^[+]?[\s\-]?[0-9]{7,15}$/, "Invalid phone number format"),
	address: addressSchema,
	roles: z.array(z.nativeEnum(UserRole)).optional().default([UserRole.USER]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
