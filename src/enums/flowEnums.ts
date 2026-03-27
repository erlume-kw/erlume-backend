/**
 * Enums for pickup, return, delivery, and escalation flows.
 * Exposed via GET /api/enums/{category} for client dropdowns/filters.
 */

/** Item authentication result (pickup pipeline). */
export enum AuthenticationStatus {
	Pending = "pending",
	Authentic = "authentic",
	NotAuthentic = "not_authentic",
}

/** Item return status (after sale / unsold). */
export enum ReturnStatus {
	Pending = "pending",
	Scheduled = "scheduled",
	Returned = "returned",
	NotReturned = "not_returned",
}

/** Order delivery status. */
export enum DeliveryStatus {
	Pending = "pending",
	Shipped = "shipped",
	Delivered = "delivered",
	Failed = "failed",
}

/** Seller escalation (e.g. seller did not respond). */
export enum EscalationStatus {
	None = "none",
	SellerNoResponse = "seller_no_response",
	Escalated = "escalated",
	Resolved = "resolved",
}
