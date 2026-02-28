# API and Field Audience

Which endpoints and conventions each client (backoffice vs customer-facing frontend) should use. Matches `x-usedBy` in `openapi.json`.

---

## Audiences

| Audience | Description |
|----------|-------------|
| **backoffice** | Admin dashboard (erlume-backoffice). Full CRUD, internal data, seller/user management. |
| **frontend** | Customer-facing website. Catalog, checkout, my orders, reviews, discount validation. |
| **both** | Used by both backoffice and frontend. Catalog, orders, shared lookups. |

---

## Endpoints by Audience

### Backoffice only

| Path | Notes |
|------|-------|
| `/api/users` | User accounts, roles |
| `/api/users/{id}` | User CRUD |
| `/api/users/{id}/roles` | Role management |
| `/api/sellers` | List sellers |
| `/api/sellers/{id}` | Seller CRUD — **single path for all seller updates** |

| `/api/orderitems` | Order line items |
| `/api/orderitems/{id}` | |
| `/api/orders/{id}/status` | Update order status |
| `/api/transactions` | Payments |
| `/api/transactions/order/{orderId}` | |
| `/api/transactions/{id}` | |
| `/api/expenses` | Expenses |
| `/api/expenses/{id}` | |
| `/api/employees` | Employee/salary records |
| `/api/employees/{id}` | |
| `/api/incomes` | Income records (amount = Erlume commission). seller_id accepts Seller _id or User id. |
| `/api/incomes/{id}` | |
| `/api/creditcards` | All credit cards |
| `/api/demands` | Demand rates |
| `/api/demands/{id}` | |
| `/api/discountcodes` | Discount codes |
| `/api/discountcodes/{id}` | |
| `/api/drops/{id}/items/{itemId}` | Remove item from drop |
| `/api/outfititems` | Outfit items |
| `/api/outfititems/{id}` | |
| `/api/sales` | Sales records |
| `/api/sales/{id}` | |
| `/api/sales/order/{orderId}` | |

### Frontend only

| Path | Notes |
|------|-------|
| `POST /api/discountcodes/validate` | Validate discount code at checkout |

### Both (backoffice + frontend)

| Path | Notes |
|------|-------|
| `/api/items` | Catalog |
| `/api/items/{id}` | |
| `/api/categories` | Categories |
| `/api/categories/{id}` | |
| `/api/subcategories` | Subcategories |
| `/api/subcategories/{id}` | |
| `/api/orders` | Orders |
| `/api/orders/user/{userId}` | Orders by customer |
| `/api/orders/{id}` | Order details |
| `/api/creditcards/user/{userId}` | User's saved cards |
| `/api/creditcards/{id}` | |
| `/api/reviews` | Reviews |
| `/api/reviews/{id}` | |
| `/api/drops` | Drops |
| `/api/drops/{id}` | |
| `/api/drops/{id}/items` | Items in drop |
| `/api/discountcodes/code/{code}` | Get discount by code |
| `/api/outfits` | Outfits |
| `/api/outfits/{id}` | |
| `/api/enums` | Enum values |
| `/api/enums/{category}` | Enum by category |

---

## Seller updates: single path

**All seller profile updates must go through:**

```
PATCH /api/sellers/{id}
PUT  /api/sellers/{id}
```

- **Do not** use `/api/users` for seller data
- **id** = seller document `_id` or user ID (both work; `getSellerById` accepts either)
- Use this for: balance, IBAN, consentGiven, preferredPickupDate, sellerPolicyAcceptedAt, escalationStatus, escalationNotes

---

## Sale vs Income

| Entity | Purpose | Key fields |
|--------|---------|------------|
| **Sale** | Full transaction breakdown + invoice/evidence | `amount` = total listing price (gross), `erlumeCommission`, `sellerPayout`, invoice_url, payment_evidence_url |
| **Income** | Erlume bank receipt only — what actually got to Erlume's account | `amount` = Erlume commission (excludes seller payout) |

- **Sale** = total + commission + payout breakdown; use for sales records, invoice/evidence.
- **Income** = Erlume revenue only; use for Erlume financial reports, bank reconciliation.

---

## Enums

Load dropdown/options from `GET /api/enums` or `GET /api/enums/{category}`. Do not hardcode enum values in frontend or backoffice. Categories include: `orderStatus`, `itemStatus`, `expenseType`, `itemCondition`, `paymentMethod`, `transactionStatus`, `bagBrand`, etc.

---

## Swagger docs

| URL | Description |
|-----|-------------|
| `/api-docs` | Full API |
| `/api-docs/backoffice` | Backoffice-only paths |
| `/api-docs/frontend` | Frontend-only paths |
