"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = void 0;
/**
 * Payment Method Enum
 * Represents the different payment methods available in Kuwait
 */
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["KNET"] = "knet";
    PaymentMethod["CreditCard"] = "credit_card";
    PaymentMethod["DebitCard"] = "debit_card";
    PaymentMethod["TapPayments"] = "tap_payments";
    PaymentMethod["CashOnDelivery"] = "cash_on_delivery";
    PaymentMethod["BankTransfer"] = "bank_transfer";
    PaymentMethod["ApplePay"] = "apple_pay";
    PaymentMethod["GooglePay"] = "google_pay";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
