/**
 * Transaction Status Enum
 * Represents the status of a payment transaction
 */
export enum TransactionStatus {
	Pending = "pending",
	Processing = "processing",
	Completed = "completed",
	Failed = "failed",
	Refunded = "refunded",
	PartiallyRefunded = "partially_refunded",
	Cancelled = "cancelled",
}
