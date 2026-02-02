/**
 * Payment Method Enum
 * Represents the different payment methods available in Kuwait
 */
export enum PaymentMethod {
	KNET = "knet", // Kuwait's national payment network (most common)
	CreditCard = "credit_card", // Credit card (typically processed through KNET)
	DebitCard = "debit_card", // Debit card (typically processed through KNET)
	TapPayments = "tap_payments", // Tap Payments (popular in Kuwait/Middle East)
	CashOnDelivery = "cash_on_delivery", // Cash on delivery
	BankTransfer = "bank_transfer", // Bank transfer
	ApplePay = "apple_pay", // Apple Pay (if available in Kuwait)
	GooglePay = "google_pay", // Google Pay (if available in Kuwait)
}
