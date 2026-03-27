/**
 * Seller onboarding and items processing status enums.
 * Exposed via GET /api/enums/{category} for client dropdowns/filters.
 */

/**
 * Tracks where the seller is in the Erlume onboarding journey.
 * Updated manually by the Erlume team in the backoffice.
 */
export enum SellerOnboardingStatus {
	InitialContact = "initial_contact",       // Erlume has first reached out
	PriceShared = "price_shared",             // Commission terms shared with seller
	GoogleFormSubmitted = "google_form_submitted", // Seller filled the intake Google Form
	ManualEntryPending = "manual_entry_pending",   // Erlume team still needs to enter their data
	ReadyForPickup = "ready_for_pickup",      // Agreed and ready — Erlume to collect items
	Onboarded = "onboarded",                  // Fully onboarded
}

/**
 * Tracks where the seller's items are in the physical processing pipeline.
 * Can be auto-derived from item statuses or set manually.
 */
export enum ItemsOnboardingStatus {
	NoItems = "no_items",                     // Seller onboarded but no items submitted yet
	ItemsPendingPickup = "items_pending_pickup", // Items submitted, awaiting Erlume pickup
	ItemsReceived = "items_received",         // Items picked up and received at Erlume
	ItemsInProcessing = "items_in_processing", // Being photographed / cleaned / authenticated
	ItemsListed = "items_listed",             // All items live and available for sale
	PartiallyListed = "partially_listed",     // Some listed, others still in processing
}
