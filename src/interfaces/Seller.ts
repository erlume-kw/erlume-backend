import { Document, Types } from "mongoose";
import { EscalationStatus } from "../enums/flowEnums";
import { SellerOnboardingStatus, ItemsOnboardingStatus } from "../enums/sellerEnums";

export interface SellerInterface extends Document {
	userId: Types.ObjectId; // Reference to the User
	fullName?: string; // Full name from form
	emailAddress?: string; // Email address from form
	phoneNumber?: string; // Phone number from form
	addressText?: string; // Free-form address text
	balance: string; // Seller's balance
	itemIds: Types.ObjectId[]; // List of ObjectIds referencing the items listed by the seller
	IBAN: string; // International Bank Account Number
	qrCode: string; // QR code for payments
	isDeactivated: boolean; // Indicates if the seller account is deactivated
	consentGiven?: boolean; // Consent from form (Yes/No)
	preferredPickupDate?: string; // Preferred pickup date/day (e.g., "Friday")
	intakeTimestamp?: string; // Intake timestamp
	/** When seller agreed to seller policies (optional). */
	sellerPolicyAcceptedAt?: Date;
	/** Escalation state (e.g. seller did not respond). */
	escalationStatus?: EscalationStatus;
	/** Notes for escalation / Notion flow. */
	escalationNotes?: string;
	/** Where the seller is in the Erlume onboarding journey. */
	onboardingStatus?: SellerOnboardingStatus;
	/** Where the seller's items are in the physical processing pipeline. */
	itemsOnboardingStatus?: ItemsOnboardingStatus;
	createdAt: Date;
	updatedAt: Date;
}
