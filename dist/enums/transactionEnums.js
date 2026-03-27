"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = void 0;
/**
 * Transaction Status Enum
 * Represents the status of a payment transaction
 */
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["Pending"] = "pending";
    TransactionStatus["Processing"] = "processing";
    TransactionStatus["Completed"] = "completed";
    TransactionStatus["Failed"] = "failed";
    TransactionStatus["Refunded"] = "refunded";
    TransactionStatus["PartiallyRefunded"] = "partially_refunded";
    TransactionStatus["Cancelled"] = "cancelled";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
