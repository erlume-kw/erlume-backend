"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeParamSchema = exports.sellerIdParamSchema = exports.userIdParamSchema = exports.orderIdParamSchema = exports.idParamSchema = exports.updateEmployeeSchema = exports.createEmployeeSchema = exports.toggleOutfitItemFeaturedBodySchema = exports.updateOutfitItemSchema = exports.createOutfitItemSchema = exports.updateOutfitSchema = exports.createOutfitSchema = exports.updateCreditCardSchema = exports.createCreditCardSchema = exports.validateDiscountCodeSchema = exports.updateDiscountCodeSchema = exports.createDiscountCodeSchema = exports.updateExpenseSchema = exports.createExpenseSchema = exports.updateIncomeSchema = exports.createIncomeSchema = exports.recalculateSaleCommissionsBodySchema = exports.updateSaleSchema = exports.createSaleSchema = exports.updateTransactionSchema = exports.createTransactionSchema = exports.updateReviewSchema = exports.createReviewSchema = exports.updateDropSchema = exports.createDropSchema = exports.updateDemandSchema = exports.createDemandSchema = exports.updateSubCategorySchema = exports.createSubCategorySchema = exports.updateCategorySchema = exports.createCategorySchema = exports.updateSellerSchema = exports.createSellerSchema = exports.updateOrderItemSchema = exports.createOrderItemSchema = exports.updateOrderStatusSchema = exports.updateOrderSchema = exports.createOrderSchema = exports.updateItemSchema = exports.createItemSchema = exports.updateUserRolesSchema = exports.updateUserSchema = exports.createUserSchema = exports.addressSchema = exports.objectIdSchema = void 0;
exports.registerSchema = exports.loginSchema = exports.userFilterQuerySchema = exports.itemFilterQuerySchema = exports.dateFilterQuerySchema = exports.paginationQuerySchema = exports.dropItemParamsSchema = exports.categoryParamSchema = void 0;
const zod_1 = require("zod");
const itemEnums_1 = require("../enums/itemEnums");
const statusEnums_1 = require("../enums/statusEnums");
const flowEnums_1 = require("../enums/flowEnums");
const sellerEnums_1 = require("../enums/sellerEnums");
const orderEnums_1 = require("../enums/orderEnums");
const userEnums_1 = require("../enums/userEnums");
const paymentEnums_1 = require("../enums/paymentEnums");
const transactionEnums_1 = require("../enums/transactionEnums");
const dropEnums_1 = require("../enums/dropEnums");
const reviewEnums_1 = require("../enums/reviewEnums");
// MongoDB ObjectId validation helper
exports.objectIdSchema = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");
// Date validation - accepts ISO string or Date object
const dateSchema = zod_1.z.union([
    zod_1.z.string().datetime(),
    zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/), // YYYY-MM-DD format
    zod_1.z.date(),
]).transform((val) => (typeof val === "string" ? new Date(val) : val));
// Address schema
exports.addressSchema = zod_1.z.object({
    street: zod_1.z.string().min(1, "Street is required"),
    city: zod_1.z.string().min(1, "City is required"),
    block: zod_1.z.string().min(1, "Block is required"),
    governorate: zod_1.z.string().min(1, "Governorate is required"),
    house: zod_1.z.string().min(1, "House number is required"),
    flat: zod_1.z.string().optional(),
}).strict(); // Don't allow extra fields
// ==================== USER SCHEMAS ====================
exports.createUserSchema = zod_1.z.object({
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    emailAddress: zod_1.z.string().email("Invalid email address"),
    phoneNumber: zod_1.z.string().regex(/^[+]?[\s\-]?[0-9]{7,15}$/, "Invalid phone number format"),
    address: exports.addressSchema,
    roles: zod_1.z.array(zod_1.z.nativeEnum(userEnums_1.UserRole)).optional().default([userEnums_1.UserRole.USER]),
    consentGiven: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]).optional(),
    preferredPickupDate: zod_1.z.string().optional(),
});
exports.updateUserSchema = exports.createUserSchema.partial().extend({
    password: zod_1.z.string().min(6).optional(),
    roles: zod_1.z.array(zod_1.z.nativeEnum(userEnums_1.UserRole)).optional(),
    isDeleted: zod_1.z.boolean().optional(), // Allow soft delete via PATCH
});
exports.updateUserRolesSchema = zod_1.z.object({
    roles: zod_1.z.array(zod_1.z.nativeEnum(userEnums_1.UserRole)).min(1, "At least one role is required"),
});
// ==================== ITEM SCHEMAS ====================
// Base item schema without refinements (for use with .partial())
const baseItemSchema = zod_1.z.object({
    basePrice: zod_1.z.string().min(1, "Base price is required"),
    condition: zod_1.z.nativeEnum(itemEnums_1.ItemCondition),
    uploadedAt: dateSchema,
    saleRate: zod_1.z.string().min(1, "Sale rate is required"),
    itemStatus: zod_1.z.nativeEnum(statusEnums_1.ItemStatus),
    color: zod_1.z.string().min(1, "Color is required"),
    size: zod_1.z.string().min(1, "Size is required"),
    itemName: zod_1.z.string().optional(),
    bag: zod_1.z.string().optional(), // Legacy field name
    itemModel: zod_1.z.string().optional(),
    year: zod_1.z.string().optional(),
    quantity: zod_1.z.string().min(1, "Quantity is required"),
    brandName: zod_1.z.string().min(1, "Brand name is required"),
    imageUrls: zod_1.z.array(zod_1.z.string().url("Invalid image URL")).optional(),
    photoUrls: zod_1.z.array(zod_1.z.string().url("Invalid photo URL")).optional(), // Legacy field name
    receiptPhotoUrls: zod_1.z.array(zod_1.z.string().url("Invalid receipt photo URL")).optional(),
    priceEstimatorUrls: zod_1.z.array(zod_1.z.string().url("Invalid price estimator URL")).optional(),
    quoteUrls: zod_1.z.array(zod_1.z.string().url("Invalid quote URL")).optional(),
    approved: zod_1.z.boolean().optional(),
    approvedNextDrop: zod_1.z.boolean().optional(),
    orderId: exports.objectIdSchema.optional(),
    authNeeded: zod_1.z.boolean().optional(),
    cleaningNeeded: zod_1.z.boolean().optional(),
    listingPrice: zod_1.z.string().min(1, "Listing price is required"),
    photographed: zod_1.z.boolean().optional(),
    authenticationStatus: zod_1.z.nativeEnum(flowEnums_1.AuthenticationStatus).optional(),
    authenticatedAt: dateSchema.optional(),
    returnDate: dateSchema.optional(),
    returnStatus: zod_1.z.nativeEnum(flowEnums_1.ReturnStatus).optional(),
    seller_id: exports.objectIdSchema.optional(),
    category_id: exports.objectIdSchema,
    sub_category_id: exports.objectIdSchema.optional(),
    drop_id: exports.objectIdSchema.optional(),
});
// Create schema with refinements
exports.createItemSchema = baseItemSchema.refine((data) => {
    const imageUrlsArray = data.imageUrls || [];
    const photoUrlsArray = data.photoUrls || [];
    const allImages = [...imageUrlsArray, ...photoUrlsArray];
    return allImages.length > 0;
}, {
    message: "At least one image URL is required (imageUrls or photoUrls)",
    path: ["imageUrls"],
}).refine((data) => data.itemName || data.bag, {
    message: "Either itemName or bag must be provided",
    path: ["itemName"],
});
/**
 * PATCH/PUT bodies often come from spreading a GET response: `sellerId` vs `seller_id`,
 * `null` for cleared refs (Zod `.optional()` does not accept `null`), numbers for string
 * fields, and Mongo read-only keys. Normalize before validating.
 */
function preprocessItemUpdateBody(val) {
    if (val === null || typeof val !== "object" || Array.isArray(val)) {
        return val;
    }
    const o = Object.assign({}, val);
    // API exposes sellerId; model uses seller_id
    if ("sellerId" in o && !("seller_id" in o)) {
        o.seller_id = o.sellerId;
    }
    delete o.sellerId;
    for (const k of ["_id", "__v", "createdAt", "updatedAt", "id"]) {
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
    ]) {
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
    ]) {
        if (typeof o[k] === "number") {
            o[k] = String(o[k]);
        }
    }
    return o;
}
// Update: allow non-URL image strings (relative paths / CDN) — create still uses .url()
const itemUpdateImageArray = zod_1.z.array(zod_1.z.string().min(1, "Image URL cannot be empty")).optional();
// Update schema without create-only refinements
const optionalObjectIdOrClear = zod_1.z
    .union([
    exports.objectIdSchema,
    zod_1.z.null(),
    zod_1.z.literal(""),
])
    .optional();
exports.updateItemSchema = zod_1.z.preprocess(preprocessItemUpdateBody, baseItemSchema
    .partial()
    .extend({
    listingPrice: zod_1.z
        .union([
        zod_1.z.string().min(1, "Listing price cannot be empty"),
        zod_1.z.number().transform((n) => String(n)),
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
}));
// ==================== ORDER SCHEMAS ====================
exports.createOrderSchema = zod_1.z.object({
    user_id: exports.objectIdSchema,
    orderItems: zod_1.z.array(zod_1.z.object({
        item_id: exports.objectIdSchema,
        quantity: zod_1.z.number().int().min(1).optional(),
        is_returned: zod_1.z.boolean().optional(),
    })).min(1, "At least one order item is required"),
    order_status: zod_1.z.nativeEnum(orderEnums_1.OrderStatus).optional(),
    // Note: orderitem_ids, deliveryDate, deliveryStatus, trackingReference are set by backend
});
exports.updateOrderSchema = exports.createOrderSchema.partial();
exports.updateOrderStatusSchema = zod_1.z.object({
    order_status: zod_1.z.nativeEnum(orderEnums_1.OrderStatus),
});
// ==================== ORDER ITEM SCHEMAS ====================
exports.createOrderItemSchema = zod_1.z.object({
    order_id: exports.objectIdSchema,
    is_returned: zod_1.z.boolean(),
    item_id: exports.objectIdSchema,
    quantity: zod_1.z.number().int().min(1, "Quantity must be at least 1"),
    price: zod_1.z.string().min(1, "Price is required"),
});
exports.updateOrderItemSchema = exports.createOrderItemSchema.partial();
// ==================== SELLER SCHEMAS ====================
exports.createSellerSchema = zod_1.z.object({
    userId: exports.objectIdSchema,
    fullName: zod_1.z.string().optional(),
    emailAddress: zod_1.z.string().email("Invalid email address").optional(),
    phoneNumber: zod_1.z.string().regex(/^[+]?[\s\-]?[0-9]{7,15}$/).optional(),
    addressText: zod_1.z.string().optional(),
    balance: zod_1.z.string().min(1, "Balance is required"),
    itemIds: zod_1.z.array(exports.objectIdSchema).optional(),
    IBAN: zod_1.z.string().optional(),
    qrCode: zod_1.z.string().optional(),
    isDeactivated: zod_1.z.boolean().optional(),
    consentGiven: zod_1.z.boolean().optional(),
    preferredPickupDate: zod_1.z.string().optional(),
    intakeTimestamp: zod_1.z.string().optional(),
    sellerPolicyAcceptedAt: dateSchema.optional(),
    escalationStatus: zod_1.z.nativeEnum(flowEnums_1.EscalationStatus).optional(),
    escalationNotes: zod_1.z.string().optional(),
});
exports.updateSellerSchema = zod_1.z.object({
    fullName: zod_1.z.string().optional(),
    emailAddress: zod_1.z.string().email("Invalid email address").optional(),
    phoneNumber: zod_1.z.string().regex(/^[+]?[\s\-]?[0-9]{7,15}$/).optional(),
    addressText: zod_1.z.string().optional(),
    balance: zod_1.z.string().optional(),
    IBAN: zod_1.z.string().optional(),
    qrCode: zod_1.z.string().optional(),
    isDeactivated: zod_1.z.boolean().optional(),
    consentGiven: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]).optional(),
    preferredPickupDate: zod_1.z.string().optional(),
    intakeTimestamp: zod_1.z.string().optional(),
    sellerPolicyAcceptedAt: dateSchema.optional(),
    escalationStatus: zod_1.z.nativeEnum(flowEnums_1.EscalationStatus).optional(),
    escalationNotes: zod_1.z.string().optional(),
    onboardingStatus: zod_1.z.nativeEnum(sellerEnums_1.SellerOnboardingStatus).optional(),
    itemsOnboardingStatus: zod_1.z.nativeEnum(sellerEnums_1.ItemsOnboardingStatus).optional(),
});
// ==================== CATEGORY SCHEMAS ====================
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Category name is required"),
    base_rate: zod_1.z.number().transform((val) => String(val)),
    op_rate: zod_1.z.number().optional().transform((val) => val !== undefined ? String(val) : undefined),
    clean_rate: zod_1.z.number().optional().transform((val) => val !== undefined ? String(val) : undefined),
    sub_category_id: exports.objectIdSchema.optional(),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
// ==================== SUB CATEGORY SCHEMAS ====================
exports.createSubCategorySchema = zod_1.z.object({
    sub_cat_name: zod_1.z.string().min(1, "Sub category name is required"),
    category_id: exports.objectIdSchema,
    demand_id: exports.objectIdSchema.optional(),
    sub_clean_rate: zod_1.z.number().optional().transform((val) => val !== undefined ? String(val) : undefined),
});
exports.updateSubCategorySchema = exports.createSubCategorySchema.partial();
// ==================== DEMAND SCHEMAS ====================
exports.createDemandSchema = zod_1.z.object({
    demand_name: zod_1.z.string().min(1, "Demand name is required"),
    demand_rate: zod_1.z.number().optional().transform((val) => val !== undefined ? String(val) : undefined),
});
exports.updateDemandSchema = exports.createDemandSchema.partial();
// ==================== DROP SCHEMAS ====================
exports.createDropSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Drop name is required"),
    description: zod_1.z.string().optional(),
    releaseDate: dateSchema,
    status: zod_1.z.nativeEnum(dropEnums_1.DropStatus),
});
exports.updateDropSchema = exports.createDropSchema.partial();
// ==================== REVIEW SCHEMAS ====================
exports.createReviewSchema = zod_1.z.object({
    userId: exports.objectIdSchema.optional(),
    sellerId: exports.objectIdSchema,
    rating: zod_1.z.number().int().min(1).max(5).or(zod_1.z.nativeEnum(reviewEnums_1.Stars)),
    description: zod_1.z.string().min(1, "Description is required"),
});
exports.updateReviewSchema = exports.createReviewSchema.partial();
// ==================== TRANSACTION SCHEMAS ====================
exports.createTransactionSchema = zod_1.z.object({
    order_id: exports.objectIdSchema,
    discount_rate: zod_1.z.string().min(1, "Discount rate is required"),
    amount: zod_1.z.string().min(1, "Amount is required"),
    discount_id: exports.objectIdSchema.optional(),
    status: zod_1.z.nativeEnum(transactionEnums_1.TransactionStatus),
    paymentMethod: zod_1.z.nativeEnum(paymentEnums_1.PaymentMethod).optional(),
});
exports.updateTransactionSchema = exports.createTransactionSchema.partial();
// ==================== SALE SCHEMAS ====================
exports.createSaleSchema = zod_1.z.object({
    order_id: exports.objectIdSchema.optional(),
    order_item_id: exports.objectIdSchema.optional(),
    item_id: exports.objectIdSchema.optional(),
    transaction_id: exports.objectIdSchema.optional(),
    amount: zod_1.z.string().optional(),
    listingPrice: zod_1.z.string().optional(),
    erlumeCommission: zod_1.z.string().optional(),
    sellerPayout: zod_1.z.string().optional(),
    buyer: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    sale_date: dateSchema.optional(),
    bag_record: zod_1.z.string().optional(),
    invoice_number: zod_1.z.string().optional(),
    invoice_url: zod_1.z.string().url("Invalid invoice URL").optional(),
    payment_evidence_url: zod_1.z.string().url("Invalid payment evidence URL").optional(),
});
exports.updateSaleSchema = exports.createSaleSchema.partial();
/** POST /api/sales/recalculate-commissions — no body fields; empty JSON only */
exports.recalculateSaleCommissionsBodySchema = zod_1.z.preprocess((val) => (val === undefined || val === null ? {} : val), zod_1.z.object({}).strict());
// ==================== INCOME SCHEMAS ====================
exports.createIncomeSchema = zod_1.z.object({
    order_id: exports.objectIdSchema.optional(),
    order_item_id: exports.objectIdSchema.optional(),
    item_id: exports.objectIdSchema.optional(),
    seller_id: exports.objectIdSchema.optional(),
    amount: zod_1.z.string().min(1, "Amount is required"),
    erlumeCommissionAmount: zod_1.z.string().optional(),
    sellerPayoutAmount: zod_1.z.string().optional(),
    currency: zod_1.z.string().default("KWD"),
    platform: zod_1.z.string().optional(),
    income_type: zod_1.z.string().default("sale"),
    received_at: dateSchema.optional(),
    month: dateSchema.optional(),
    prelaunch_bag: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateIncomeSchema = exports.createIncomeSchema.partial();
// ==================== EXPENSE SCHEMAS ====================
exports.createExpenseSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Expense name is required"),
    cost: zod_1.z.string().min(1, "Cost is required"),
    currency: zod_1.z.string().default("KWD"),
    employee_id: exports.objectIdSchema.optional(),
    notes: zod_1.z.string().optional(),
    type: zod_1.z.array(zod_1.z.string()).min(1, "At least one expense type is required"),
    month: dateSchema,
    paidBy: zod_1.z.string().optional(),
    isRecurring: zod_1.z.boolean().optional(),
    phase: zod_1.z.string().optional(),
});
exports.updateExpenseSchema = exports.createExpenseSchema.partial();
// ==================== DISCOUNT CODE SCHEMAS ====================
exports.createDiscountCodeSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Discount code is required").transform((val) => val.toUpperCase()),
    discount_percentage: zod_1.z.number()
        .min(0, "Discount percentage must be at least 0")
        .max(100, "Discount percentage must be at most 100")
        .transform((val) => String(val)),
    expiry_date: dateSchema,
    is_active: zod_1.z.boolean().default(true),
});
exports.updateDiscountCodeSchema = exports.createDiscountCodeSchema.partial();
exports.validateDiscountCodeSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Discount code is required"),
    orderTotal: zod_1.z.string().optional(),
});
// ==================== CREDIT CARD SCHEMAS ====================
exports.createCreditCardSchema = zod_1.z.object({
    cardNumber: zod_1.z.string().min(1, "Card number is required"),
    expiryDate: zod_1.z.string().min(1, "Expiry date is required"),
    holderName: zod_1.z.string().min(1, "Cardholder name is required"),
});
exports.updateCreditCardSchema = exports.createCreditCardSchema.partial();
// ==================== OUTFIT SCHEMAS ====================
exports.createOutfitSchema = zod_1.z.object({
    item_ids: zod_1.z.array(exports.objectIdSchema).min(1, "At least one item ID is required"),
    outfit_title: zod_1.z.string().min(1, "Outfit title is required"),
    outfit_tags: zod_1.z.string().min(1, "Outfit tags is required"),
});
exports.updateOutfitSchema = exports.createOutfitSchema.partial();
// ==================== OUTFIT ITEM SCHEMAS ====================
exports.createOutfitItemSchema = zod_1.z.object({
    item_id: exports.objectIdSchema,
    outfit_id: exports.objectIdSchema,
    featured_in_product: zod_1.z.boolean(),
});
exports.updateOutfitItemSchema = exports.createOutfitItemSchema.partial();
/** PATCH /api/outfititems/:id/featured — optional `featured` toggles; omit to flip */
exports.toggleOutfitItemFeaturedBodySchema = zod_1.z.preprocess((val) => (val === undefined || val === null ? {} : val), zod_1.z.object({ featured: zod_1.z.boolean().optional() }).strict());
// ==================== EMPLOYEE SCHEMAS ====================
exports.createEmployeeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Employee name is required"),
    photo: zod_1.z.string().url("Invalid photo URL").optional(),
    role: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
    salaryActual: zod_1.z.string().optional(),
    salaryProjected: zod_1.z.string().optional(),
    user_id: exports.objectIdSchema.optional(),
});
exports.updateEmployeeSchema = exports.createEmployeeSchema.partial();
// ==================== PARAM VALIDATION SCHEMAS ====================
exports.idParamSchema = zod_1.z.object({
    id: exports.objectIdSchema,
});
exports.orderIdParamSchema = zod_1.z.object({
    orderId: exports.objectIdSchema,
});
exports.userIdParamSchema = zod_1.z.object({
    userId: exports.objectIdSchema,
});
exports.sellerIdParamSchema = zod_1.z.object({
    sellerId: exports.objectIdSchema,
});
exports.codeParamSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Code is required"),
});
exports.categoryParamSchema = zod_1.z.object({
    category: zod_1.z.string().min(1, "Category is required"),
});
exports.dropItemParamsSchema = zod_1.z.object({
    id: exports.objectIdSchema,
    itemId: exports.objectIdSchema,
});
// ==================== QUERY VALIDATION SCHEMAS ====================
// All query schemas should allow empty queries and make all fields optional
// Using passthrough() to allow additional query params that aren't in the schema
exports.paginationQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    skip: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
}).passthrough(); // Allow additional query params
exports.dateFilterQuerySchema = zod_1.z.object({
    year: zod_1.z.string().regex(/^\d{4}$/).transform(Number).optional(),
    month: zod_1.z.string().regex(/^(0?[1-9]|1[0-2])$/).transform(Number).optional(),
}).passthrough(); // Allow additional query params
exports.itemFilterQuerySchema = zod_1.z.object({
    itemStatus: zod_1.z.nativeEnum(statusEnums_1.ItemStatus).optional(),
    category_id: exports.objectIdSchema.optional(),
    sub_category_id: exports.objectIdSchema.optional(),
    drop_id: exports.objectIdSchema.optional(),
    seller_id: exports.objectIdSchema.optional(),
}).passthrough(); // Allow additional query params
exports.userFilterQuerySchema = zod_1.z.object({
    includeDeleted: zod_1.z.enum(["true", "false"]).optional(),
    role: zod_1.z.string().optional(),
}).passthrough(); // Allow additional query params
// ==================== AUTH SCHEMAS ====================
exports.loginSchema = zod_1.z.object({
    emailAddress: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.registerSchema = zod_1.z.object({
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    emailAddress: zod_1.z.string().email("Invalid email address"),
    phoneNumber: zod_1.z.string().regex(/^[+]?[\s\-]?[0-9]{7,15}$/, "Invalid phone number format"),
    address: exports.addressSchema,
    roles: zod_1.z.array(zod_1.z.nativeEnum(userEnums_1.UserRole)).optional().default([userEnums_1.UserRole.USER]),
});
