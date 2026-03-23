"use strict";
/**
 * Enums for pickup, return, delivery, and escalation flows.
 * Exposed via GET /api/enums/{category} for client dropdowns/filters.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationStatus = exports.DeliveryStatus = exports.ReturnStatus = exports.AuthenticationStatus = void 0;
/** Item authentication result (pickup pipeline). */
var AuthenticationStatus;
(function (AuthenticationStatus) {
    AuthenticationStatus["Pending"] = "pending";
    AuthenticationStatus["Authentic"] = "authentic";
    AuthenticationStatus["NotAuthentic"] = "not_authentic";
})(AuthenticationStatus || (exports.AuthenticationStatus = AuthenticationStatus = {}));
/** Item return status (after sale / unsold). */
var ReturnStatus;
(function (ReturnStatus) {
    ReturnStatus["Pending"] = "pending";
    ReturnStatus["Scheduled"] = "scheduled";
    ReturnStatus["Returned"] = "returned";
    ReturnStatus["NotReturned"] = "not_returned";
})(ReturnStatus || (exports.ReturnStatus = ReturnStatus = {}));
/** Order delivery status. */
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["Pending"] = "pending";
    DeliveryStatus["Shipped"] = "shipped";
    DeliveryStatus["Delivered"] = "delivered";
    DeliveryStatus["Failed"] = "failed";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
/** Seller escalation (e.g. seller did not respond). */
var EscalationStatus;
(function (EscalationStatus) {
    EscalationStatus["None"] = "none";
    EscalationStatus["SellerNoResponse"] = "seller_no_response";
    EscalationStatus["Escalated"] = "escalated";
    EscalationStatus["Resolved"] = "resolved";
})(EscalationStatus || (exports.EscalationStatus = EscalationStatus = {}));
