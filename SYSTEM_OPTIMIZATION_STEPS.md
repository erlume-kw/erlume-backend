# System Optimization Roadmap - Detailed Steps

## Overview

This document outlines step-by-step instructions to elevate your backend system with AdminJS integration, payment gateway, Zoho invoice system, and enhanced logistics tracking.

---

## PHASE 1: Database Schema Enhancements

### Step 1.1: Enhance Seller Model

**Add these fields to Seller schema:**

- `onboardingStatus`: Enum ["initial_contact", "price_shared", "google_form_submitted", "manual_entry_pending", "ready_for_pickup", "onboarded"]
- `lastContactDate`: Date
- `responseStatus`: Enum ["responsive", "delayed", "non_responsive"]
- `escalationLevel`: Number (0-4)
- `totalItemsSold`: Number (default: 0)
- `totalEarnings`: String (default: "0") (total seller share received)
- `totalErlumeCommission`: String (default: "0") (total Erlume share from this seller's items)
- `zohoContactId`: String
- `iban`: String (add IBAN for payments)
- `agreementSigned`: Boolean (whether seller agreement was signed)
- `googleFormSubmissionId`: String
- `googleFormSubmittedAt`: Date
- `manuallyEnteredBy`: ObjectId (User ID of admin who entered data)
- `manuallyEnteredAt`: Date

### Step 1.2: Enhance Item Model

**Add these fields to Item schema:**

- `sellerId`: ObjectId (reference to Seller) - REQUIRED
- `pickupDate`: Date
- `authenticationStatus`: Enum ["authentic", "not_authentic"]
- `listedDate`: Date
- `soldDate`: Date
- `returnRequestDate`: Date
- `returnDate`: Date
- `listingPrice`: String (price item is listed at on website)
- `salePrice`: String (final price item was sold for - after discounts, only set when sold)
- `commissionRate`: String (commission percentage, e.g., "30" for 30%)
- `sellerShareAmount`: String (seller's portion - calculated when sold: salePrice × (1 - commissionRate))
- `erlumeShareAmount`: String (Erlume platform's portion - calculated when sold: salePrice × commissionRate)
- `photographyStatus`: Enum ["pending", "in_progress", "completed"]
- `cleaningRequired`: Boolean
- `cleaningCost`: String
- `holdingPeriodStartDate`: Date (8 weeks countdown starts here)
- `zohoItemId`: String (if you sync items to Zoho inventory)
- `drop_id`: ObjectId (reference to Drop - optional, items can belong to a drop)

### Step 1.2.1: Create Drop Model

**Create new `Drop` model:**

- `name`: String (drop name/title)
- `description`: String (optional description)
- `releaseDate`: Date (when the drop is released/launched)
- `status`: Enum ["upcoming", "active", "ended"] (drop status)

**Purpose:**

- Group items together in drops/collections
- Track drop release dates
- Filter items by drop in AdminJS and website

### Step 1.3: Enhance Order Model

**Add these fields to Order schema:**

- `paymentStatus`: Enum ["pending", "processing", "completed", "failed", "refunded", "partially_refunded"]
- `paymentMethod`: String (credit_card, bank_transfer, etc.)
- `paymentGatewayTransactionId`: String
- `zohoInvoiceId`: String (link to Zoho invoice)
- `zohoInvoiceNumber`: String
- `invoiceUrl`: String (PDF link)
- `deliveryDate`: Date
- `deliveryTimeSlot`: String
- `deliveryAddress`: Object (full address object)
- `deliveryStatus`: Enum ["pending", "scheduled", "in_transit", "delivered", "failed"]
- `customerFeedback`: Object {
  - `rating`: Number (1-5)
  - `review`: String
  - `submittedAt`: Date
    }
- `referralSource`: String (where customer came from)
- `discountCodeUsed`: String

### Step 1.4: Enhance Transaction Model

**Add these fields to Transaction schema:**

- `paymentGatewayResponse`: Object (store full response from payment gateway)
- `refundStatus`: Enum ["none", "pending", "completed", "failed"]
- `refundAmount`: String
- `refundTransactionId`: String
- `zohoPaymentId`: String (link payment to Zoho)
- `totalAmount`: String (total transaction amount)
- `sellerShareAmount`: String (seller's portion from this transaction)
- `erlumeShareAmount`: String (Erlume platform's portion from this transaction)
- `commissionRate`: String (commission percentage applied)

### Step 1.5: Create New Models

#### Pickup/Delivery Model

**Create new `PickupDelivery` model:**

- `type`: Enum ["pickup", "delivery", "return"]
- `sellerId`: ObjectId (for pickups/returns)
- `orderId`: ObjectId (for deliveries)
- `itemIds`: [ObjectId] (items involved)
- `scheduledDate`: Date
- `scheduledTimeSlot`: String
- `status`: Enum ["pending", "scheduled", "in_progress", "completed", "cancelled", "failed"]
- `driverId`: ObjectId (reference to User - driver)
- `driverName`: String
- `driverPhone`: String
- `address`: Object (full address)
- `notes`: String
- `completedAt`: Date
- `confirmationPhoto`: String

#### Escalation Model

**Create new `Escalation` model:**

- `sellerId`: ObjectId
- `itemId`: ObjectId (if item-specific)
- `type`: Enum ["non_response", "authentication_failed", "payment_issue", "delivery_issue"]
- `level`: Number (1-4)
- `status`: Enum ["active", "resolved", "escalated"]
- `actions`: [Object] {
  - `action`: String
  - `takenAt`: Date
  - `takenBy`: ObjectId
    }
- `resolvedAt`: Date

### Step 1.6: Commission Calculation Logic

**How to calculate seller share and Erlume share:**

**Formula:**

- `salePrice` = Final price item sold for (after any discounts)
- `commissionRate` = Erlume's commission percentage (e.g., 30% = 0.30)
- `erlumeShareAmount` = `salePrice` × `commissionRate`
- `sellerShareAmount` = `salePrice` - `erlumeShareAmount`

**Example:**

- Item sold for: 1000 KWD
- Commission rate: 30%
- Erlume share: 1000 × 0.30 = 300 KWD
- Seller share: 1000 - 300 = 700 KWD

**Where to store:**

- **Item level:**
  - Before sale: Store `listingPrice` and `commissionRate` (can calculate expected payout: listingPrice × (1 - commissionRate))
  - When sold: Store `salePrice`, `sellerShareAmount`, `erlumeShareAmount` (calculated from salePrice and commissionRate)
- **Transaction level:** Store same breakdown for each transaction (in case of partial payments/refunds)
- **Seller level:** Aggregate `totalEarnings` (sum of all sellerShareAmount) and `totalErlumeCommission` (sum of all erlumeShareAmount)

**Commission Rate Configuration:**

- Can be fixed percentage (e.g., 30% for all items)
- Or variable based on:
  - Item category
  - Item condition
  - Seller tier/level
  - Special promotions
- Store commission rate in Item model when item is listed or sold

**When to Calculate:**

- **Before listing:** Set `listingPrice` and `commissionRate` (can show seller expected payout: listingPrice × (1 - commissionRate))
- **When item is sold:**
  - Set `salePrice` (final price after discounts)
  - Calculate and store `sellerShareAmount` = salePrice × (1 - commissionRate)
  - Calculate and store `erlumeShareAmount` = salePrice × commissionRate
- **Transaction level:** Store same breakdown for each payment transaction
- **Seller level:** Update `totalEarnings` += sellerShareAmount, `totalErlumeCommission` += erlumeShareAmount

---

## PHASE 2: AdminJS Setup & Configuration

### Step 2.1: Install Additional AdminJS Dependencies

**Install these packages:**

- `@adminjs/upload` (for file uploads - photos, documents)
- `@adminjs/cloudinary` or `@adminjs/s3` (if using cloud storage)
- `express-session` (for AdminJS authentication)
- `express-formidable` (already installed, but configure properly)

### Step 2.2: Create AdminJS Configuration File

**Create `src/config/adminjs.config.ts`:**

- Import all your models
- Configure AdminJS with Mongoose adapter
- Set up authentication (username/password or JWT)
- Configure branding (logo, colors, company name)
- Set up file upload handling for images

### Step 2.3: Configure Resource Customization

**For each model, configure:**

- **Seller Resource:**
  - Custom properties (calculated fields: totalItemsSold, totalEarnings)
  - Filters: by onboardingStatus, responseStatus, escalationLevel, manuallyEnteredBy
  - Actions: "Send WhatsApp", "Escalate", "Generate Payout", "Mark as Entered from Google Form"
  - List view: Show key metrics (items sold, earnings, response rate)
  - Bulk import/export functionality (for Google Form data)
  - Form view optimized for manual data entry from Google Forms
- **Item Resource:**
  - Filters: by itemStatus, authenticationStatus, sellerId, brandName
  - Actions: "Mark as Authentic", "Schedule Pickup", "Request Return", "Generate Listing"
  - Custom properties: daysInHolding, daysUntilReturn
  - Image gallery view for imageUrls
- **Order Resource:**
  - Filters: by order_status, paymentStatus, deliveryStatus
  - Actions: "Generate Invoice", "Process Refund", "Update Delivery Status"
  - Custom properties: totalAmount, itemCount, customerInfo
  - Link to related Transaction, OrderItems
- **Transaction Resource:**
  - Filters: by paymentStatus, refundStatus
  - Actions: "Process Refund", "Sync with Zoho"
  - Show payment gateway details

### Step 2.4: Create Custom Dashboard

**Create dashboard components:**

- **Overview Dashboard:**
  - Total sellers (active, pending onboarding)
  - Total items (by status: pending, listed, sold)
  - Total orders (by status)
  - Revenue metrics (today, week, month)
  - Pending actions (pickups, returns, escalations)
- **Seller Dashboard:**
  - Onboarding funnel (initial_contact → onboarded)
  - Google Form submissions vs. manual entries (conversion rate)
  - Pending manual entries alert
  - Response rate metrics
  - Escalation alerts
  - Top sellers by earnings
- **Operations Dashboard:**
  - Pending pickups (next 7 days)
  - Items awaiting authentication
  - Items ready to list
  - Pending returns
  - Non-responsive sellers
- **Financial Dashboard:**
  - Revenue by day/week/month
  - Commission breakdown:
    - Total Erlume share (platform revenue)
    - Total seller payouts
    - Commission rate distribution
    - Revenue split chart (Erlume vs Seller)
  - Pending payouts (sellers awaiting payment)
  - Payment gateway status
  - Zoho sync status

### Step 2.5: Set Up AdminJS Actions

**Create custom actions:**

- **Bulk Actions:**
  - Bulk update item status
  - Bulk send WhatsApp messages
  - Bulk generate invoices
- **Seller Actions:**
  - "Import from Google Form" (manual entry form pre-filled with Google Form structure)
  - "Mark as Entered" (after manual entry from Google Form)
  - "Calculate Payout" (for sold items - calculates seller share and Erlume share)
  - "Generate Payout Report" (shows breakdown of seller share vs Erlume commission)
  - "View Commission Breakdown" (shows detailed split for each item)
  - "Escalate Seller"
  - "Send WhatsApp" (for communication)
- **Item Actions:**
  - "Authenticate Item" (opens form, updates status)
  - "Schedule Photography"
  - "Publish to Website"
  - "Request Return"
- **Order Actions:**
  - "Generate Zoho Invoice"
  - "Send Confirmation Email"
  - "Update Delivery Status"
  - "Process Refund"

### Step 2.6: Integrate AdminJS with Express

**In `src/server.ts`:**

- Import AdminJS configuration
- Set up AdminJS router with authentication
- Mount AdminJS at `/admin` route
- Configure session middleware
- Set up file upload middleware

---

## PHASE 3: Payment Gateway Integration

### Step 3.1: Choose Payment Gateway

**Recommended options:**

- Stripe (international, easy integration)
- PayPal (widely accepted)
- Tap Payments (Middle East focused - good for Kuwait)
- Checkout.com (global, good rates)

### Step 3.2: Install Payment Gateway SDK

**Install appropriate package:**

- For Stripe: `stripe`
- For Tap: `tap-payments-node`
- For PayPal: `@paypal/checkout-server-sdk`

### Step 3.3: Create Payment Service Layer

**Create `src/services/payment.service.ts`:**

- Initialize payment gateway client with API keys
- Create payment intent/checkout session
- Handle webhook events (payment success, failure, refund)
- Process refunds
- Store payment gateway responses in Transaction model

### Step 3.4: Create Payment Routes

**Create `src/routes/paymentRoutes.ts`:**

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/webhook` - Handle webhook events
- `POST /api/payments/refund` - Process refund
- `GET /api/payments/status/:transactionId` - Check payment status

### Step 3.5: Update Order Controller

**Modify order creation flow:**

- When order is created, create payment intent
- Store payment intent ID in Order
- Update paymentStatus based on gateway response
- Link payment to Transaction record

### Step 3.6: Set Up Webhook Handler

**Create webhook endpoint:**

- Verify webhook signature (security)
- Handle events: payment.succeeded, payment.failed, refund.created
- Update Order.paymentStatus
- Update Transaction records
- Trigger Zoho invoice generation on successful payment
- Send confirmation emails

### Step 3.7: Environment Variables

**Add to `.env`:**

- `PAYMENT_GATEWAY_API_KEY`
- `PAYMENT_GATEWAY_SECRET_KEY`
- `PAYMENT_GATEWAY_WEBHOOK_SECRET`
- `PAYMENT_GATEWAY_MODE` (sandbox/production)

---

## PHASE 4: Zoho Integration

### Step 4.1: Set Up Zoho API Access

**Steps:**

- Create Zoho account (if not exists)
- Register application in Zoho Developer Console
- Generate OAuth2 credentials (Client ID, Client Secret)
- Set up redirect URIs
- Generate refresh token for server-to-server communication

### Step 4.2: Install Zoho SDK

**Install package:**

- `zoho-nodejs-sdk` or use Zoho REST API directly with `axios`

### Step 4.3: Create Zoho Service Layer

**Create `src/services/zoho.service.ts`:**

- OAuth2 token management (refresh tokens automatically)
- Contact management (create/update sellers as contacts)
- Invoice generation
- Payment recording
- Inventory sync (optional - if using Zoho Inventory)
- Payout tracking

### Step 4.4: Zoho Contact Sync

**When seller is manually entered from Google Form:**

- Admin enters seller data in AdminJS (from Google Form)
- Optionally: Auto-create Zoho Contact when seller is saved
- Store `zohoContactId` in Seller model
- Update contact when seller info changes
- Sync seller balance/payout info

### Step 4.5: Zoho Invoice Generation

**When order payment is successful:**

- Create Zoho Invoice with:
  - Customer contact (from Order.user_id)
  - Line items (from OrderItems)
  - Discount codes applied
  - Payment details
- Store `zohoInvoiceId` and `zohoInvoiceNumber` in Order
- Generate PDF and store `invoiceUrl`
- Send invoice to customer via email

### Step 4.6: Zoho Payment Recording

**After payment confirmation:**

- Record payment in Zoho against invoice
- Link payment to invoice
- Update invoice status to "Paid"
- Store `zohoPaymentId` in Transaction

### Step 4.7: Zoho Payout Tracking (Optional)

**For seller payouts:**

- Create Zoho Expense/Vendor Payment when item sells
- Track commission and seller payout
- Generate payout reports

### Step 4.8: Create Zoho Routes

**Create `src/routes/zohoRoutes.ts`:**

- `POST /api/zoho/sync-seller/:sellerId` - Sync seller to Zoho
- `POST /api/zoho/generate-invoice/:orderId` - Generate invoice
- `GET /api/zoho/invoice/:invoiceId` - Get invoice details
- `POST /api/zoho/sync-payment/:transactionId` - Sync payment

### Step 4.9: Environment Variables

**Add to `.env`:**

- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_ORGANIZATION_ID`
- `ZOHO_API_BASE_URL`

---

## PHASE 5: Google Form Integration & Manual Entry Workflow

### Step 5.1: Google Form Setup

**Configure Google Form:**

- Create Google Form with all seller fields:
  - Personal info (name, email, phone/WhatsApp number)
  - Address
  - Payment details (IBAN)
  - Bag/item details (brand, model, condition, original price)
  - Agreement acceptance checkbox
- Set up form to collect email notifications (optional)
- Get Google Form webhook URL (if using Zapier/Make.com) OR
- Use Google Apps Script to send data to your API

### Step 5.2: Google Form Webhook (Optional Automation)

**If using webhook integration:**

- Set up Zapier/Make.com workflow OR
- Use Google Apps Script to POST to your API endpoint
- Endpoint: `POST /api/onboarding/google-form-webhook`
- Store submission data temporarily (in a queue or temp collection)
- Alert admin in AdminJS dashboard

### Step 5.3: Manual Entry Process in AdminJS

**Configure AdminJS for manual entry:**

- Create custom "Import Seller" action in AdminJS
- Form fields match Google Form structure
- Pre-fill option: Copy-paste from Google Form response
- Validation: Ensure all required fields are filled
- After save: Auto-update onboardingStatus to "ready_for_pickup"
- Track who entered the data (manuallyEnteredBy field)

### Step 5.4: AdminJS Bulk Import (Optional)

**For multiple sellers:**

- Create CSV export from Google Form responses
- AdminJS bulk import feature
- Map CSV columns to Seller model fields
- Validate before import
- Show import summary (successful, failed, errors)

### Step 5.5: Pending Entry Dashboard

**In AdminJS dashboard:**

- Widget showing: "Sellers Pending Manual Entry"
- Count of Google Form submissions not yet entered
- Link to entry form
- Filter by date submitted

---

## PHASE 6: WhatsApp Integration (Optional but Recommended)

### Step 5.1: Choose WhatsApp Solution

**Options:**

- WhatsApp Business API (official, requires approval)
- Twilio WhatsApp API (easier setup)
- MessageBird (good for Middle East)

### Step 5.2: Install WhatsApp SDK

**Install appropriate package based on provider**

### Step 5.3: Create WhatsApp Service

**Create `src/services/whatsapp.service.ts`:**

- Send text messages
- Send template messages (for automated flows)
- Send media (photos, documents)
- Handle incoming messages (if using webhooks)
- Store conversation history

### Step 5.4: Create Notification Service

**Create `src/services/notification.service.ts`:**

- Unified interface for WhatsApp, Email, SMS
- Queue notifications (use Bull or similar)
- Retry failed notifications
- Track notification status in Notification model

### Step 5.5: Automated WhatsApp Flows

**Set up templates for:**

- Seller onboarding welcome
- Price estimation sharing
- Intake form link
- Pickup date selection
- Authentication results
- Return requests
- Escalation warnings

---

## PHASE 7: Automation & Workflow Engine

### Step 6.1: Install Job Queue

**Install:**

- `bull` or `bullmq` (Redis-based job queue)
- `redis` (if not already installed)

### Step 6.2: Create Workflow Jobs

**Create job processors for:**

- **Onboarding Workflow:**
  - Auto-send intake form after price agreement
  - Remind seller to complete form (after 2 days)
- **Pickup Workflow:**
  - Auto-schedule pickup after form completion
  - Send pickup reminders (24h before)
  - Update item status after pickup
- **Authentication Workflow:**
  - Notify seller of authentication result
  - Auto-request return if not authentic
- **Listing Workflow:**
  - Auto-publish item after photography
  - Update website inventory
- **Sale Workflow:**
  - Auto-generate Zoho invoice on payment
  - Send order confirmation
  - Schedule delivery
- **Return Workflow:**
  - Auto-request return at 8-week mark
  - Escalate non-responsive sellers (2d, 5d, 7d)
- **Follow-up Workflow:**
  - Post-delivery thank you (day 1)
  - Review request (day 3)
  - Referral request (day 14)

### Step 6.3: Create Scheduled Tasks

**Use `node-cron` or similar:**

- Daily: Check items at 8-week mark → request return
- Daily: Check non-responsive sellers → escalate
- Daily: Generate reports
- Hourly: Sync with Zoho (if needed)
- Hourly: Check pending payments

---

## PHASE 8: API Enhancements

### Step 7.1: Create Logistics Endpoints

**Create `src/routes/logisticsRoutes.ts`:**

- `POST /api/logistics/pickup/schedule` - Schedule pickup
- `GET /api/logistics/pickup/pending` - Get pending pickups
- `POST /api/logistics/authentication/:itemId` - Update authentication
- `POST /api/logistics/return/request/:itemId` - Request return
- `GET /api/logistics/returns/pending` - Get pending returns
- `POST /api/logistics/delivery/update/:orderId` - Update delivery status

### Step 7.2: Create Seller Onboarding Endpoints

**Create `src/routes/sellerOnboardingRoutes.ts`:**

- `POST /api/onboarding/initiate` - Start onboarding
- `POST /api/onboarding/price-estimate` - Calculate price estimate
- `POST /api/onboarding/share-price` - Mark price as shared
- `POST /api/onboarding/send-form` - Generate and send intake form
- `GET /api/onboarding/status/:sellerId` - Get onboarding status

### Step 7.3: Create Analytics Endpoints

**Create `src/routes/analyticsRoutes.ts`:**

- `GET /api/analytics/dashboard` - Main dashboard metrics
- `GET /api/analytics/sellers` - Seller metrics
- `GET /api/analytics/items` - Item metrics
- `GET /api/analytics/revenue` - Revenue metrics
- `GET /api/analytics/operations` - Operations metrics

### Step 7.4: Add Request Validation

**Install:**

- `joi` or `zod` for request validation
- Add validation middleware to all routes

### Step 7.5: Add Error Handling

**Create:**

- Centralized error handler
- Custom error classes
- Error logging (Winston or similar)

---

## PHASE 9: Testing & Quality Assurance

### Step 8.1: Unit Tests

**Test:**

- Service layer functions
- Utility functions
- Price calculation logic
- Commission calculations

### Step 8.2: Integration Tests

**Test:**

- Payment gateway webhooks
- Zoho API calls
- Database operations
- Order flow end-to-end

### Step 8.3: AdminJS Testing

**Test:**

- Admin authentication
- Resource CRUD operations
- Custom actions
- Dashboard loading

---

## PHASE 10: Deployment & Monitoring

### Step 9.1: Environment Setup

**Create:**

- `.env.example` with all required variables
- Separate `.env` files for dev/staging/production

### Step 9.2: Database Indexing

**Add indexes to:**

- Seller: `onboardingStatus`, `responseStatus`, `userId`
- Item: `sellerId`, `itemStatus`, `authenticationStatus`, `pickupDate`
- Order: `paymentStatus`, `order_status`, `user_id`
- PickupDelivery: `scheduledDate`, `status`, `type`

### Step 9.3: Logging Setup

**Install:**

- `winston` for logging
- Log levels: error, warn, info, debug
- Log to files and console
- Set up log rotation

### Step 9.4: Monitoring

**Set up:**

- Health check endpoint (`/api/health`)
- Error tracking (Sentry or similar)
- Performance monitoring
- Database query monitoring

### Step 9.5: Backup Strategy

**Implement:**

- Database backups (daily)
- Backup verification
- Disaster recovery plan

---

## PHASE 11: Documentation

### Step 10.1: API Documentation

**Create:**

- API endpoint documentation
- Request/response examples
- Authentication guide
- Error codes reference

### Step 10.2: AdminJS User Guide

**Create:**

- How to use AdminJS dashboard
- How to perform common tasks
- Custom actions guide
- Reports guide

### Step 10.3: Integration Guides

**Document:**

- Payment gateway setup
- Zoho configuration
- WhatsApp setup
- Environment variables

---

## IMPLEMENTATION PRIORITY

### Phase 1 (Week 1-2): Foundation

- Database schema enhancements
- AdminJS basic setup
- Environment configuration

### Phase 2 (Week 3-4): Core Integrations

- Payment gateway integration
- Zoho basic integration (invoices)
- AdminJS customization

### Phase 3 (Week 5-6): Automation

- Workflow engine setup
- Automated notifications
- Scheduled tasks

### Phase 4 (Week 7-8): Polish & Testing

- WhatsApp integration (if needed)
- Testing
- Documentation
- Deployment

---

## KEY METRICS TO TRACK IN ADMINJS

1. **Seller Metrics:**
   - Onboarding completion rate
   - Average onboarding time
   - Google Form to database entry time (how long between form submission and manual entry)
   - Manual entry accuracy (track corrections/updates)
   - Response rate
   - Escalation rate

2. **Item Metrics:**
   - Pickup to listing time
   - Authentication pass rate
   - Time to sale
   - Return rate

3. **Order Metrics:**
   - Conversion rate
   - Average order value
   - Payment success rate
   - Delivery success rate

4. **Financial Metrics:**
   - Revenue by period (total sales)
   - Erlume platform revenue (total commission earned)
   - Seller payouts (total paid to sellers)
   - Commission breakdown (by category, seller, item)
   - Average commission rate
   - Pending payouts (sellers awaiting payment)
   - Refund rate
   - Revenue split percentage (Erlume % vs Seller %)

---

## NOTES

- **Seller Data Entry:** All seller data comes from Google Forms and is manually entered into the database via AdminJS
- **No Automated Form Sending:** WhatsApp is used for communication only, not for sending forms
- Start with Phase 1 (database) - everything else depends on it
- Test each integration separately before combining
- Use environment variables for all sensitive data
- Implement proper error handling from the start
- Set up logging early for debugging
- Keep AdminJS dashboard simple initially, add complexity gradually
- Document as you go, not at the end
- **Google Form Integration:** Can be fully manual (admin copies from Google Form to AdminJS) OR semi-automated (webhook receives form data, admin reviews and confirms entry)
