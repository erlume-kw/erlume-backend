"use strict";
/**
 * Seller onboarding and items processing status enums.
 * Exposed via GET /api/enums/{category} for client dropdowns/filters.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsOnboardingStatus = exports.SellerOnboardingStatus = void 0;
/**
 * Tracks where the seller is in the Erlume onboarding journey.
 * Updated manually by the Erlume team in the backoffice.
 */
var SellerOnboardingStatus;
(function (SellerOnboardingStatus) {
    SellerOnboardingStatus["InitialContact"] = "initial_contact";
    SellerOnboardingStatus["PriceShared"] = "price_shared";
    SellerOnboardingStatus["GoogleFormSubmitted"] = "google_form_submitted";
    SellerOnboardingStatus["ManualEntryPending"] = "manual_entry_pending";
    SellerOnboardingStatus["ReadyForPickup"] = "ready_for_pickup";
    SellerOnboardingStatus["Onboarded"] = "onboarded";
})(SellerOnboardingStatus || (exports.SellerOnboardingStatus = SellerOnboardingStatus = {}));
/**
 * Tracks where the seller's items are in the physical processing pipeline.
 * Can be auto-derived from item statuses or set manually.
 */
var ItemsOnboardingStatus;
(function (ItemsOnboardingStatus) {
    ItemsOnboardingStatus["NoItems"] = "no_items";
    ItemsOnboardingStatus["ItemsPendingPickup"] = "items_pending_pickup";
    ItemsOnboardingStatus["ItemsReceived"] = "items_received";
    ItemsOnboardingStatus["ItemsInProcessing"] = "items_in_processing";
    ItemsOnboardingStatus["ItemsListed"] = "items_listed";
    ItemsOnboardingStatus["PartiallyListed"] = "partially_listed";
})(ItemsOnboardingStatus || (exports.ItemsOnboardingStatus = ItemsOnboardingStatus = {}));
