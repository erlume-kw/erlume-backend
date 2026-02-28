---
name: Frontend Integration Improvements
overview: Backend improvement suggestions for successful integration with a customer-facing frontend website, covering auth, catalog filtering, API design, security, and performance.
todos: []
isProject: false
---

# Backend Improvements for Customer-Facing Website Integration

Reviewed your backend. Below are concrete improvements to succeed with a frontend customer-facing site.

---

## 1. Authentication and Sessions

**Current:** No login/auth. `createUser` exists but no `POST /api/auth/login`. Frontend cannot identify the customer for "My Orders" or checkout.

**Improvements:**

- **Add `POST /api/auth/login**`— Accept`emailAddress`+`password`, verify with bcrypt, return `{ user, token }`or`{ user }` and set session.
- **Add `POST /api/auth/register**`— Wrapper for customer signup:`createUser`with`roles: ["user"]`, simpler than full user create (e.g. optional address for guest-like signup).
- **JWT or session** — Use JWT (e.g. `jsonwebtoken`) or express-session for authenticated requests.
- **Auth middleware** — Protect `GET /api/orders/user/:userId`, `POST /api/reviews`, etc. Ensure `req.user.id === userId` for user-scoped routes.
- **Guest checkout** — Option: allow `createOrder` with `user_id` from session or from a temporary guest ID; or require login before checkout.

---

## 2. Catalog Filtering for Customers

**Current:** `GET /api/items` returns all items including `pending`, `rejected`, `sold`. Customers should only see `available` items.

**Improvements:**

- **Default filter for frontend** — When `GET /api/items` is called (no `itemStatus`), default to `itemStatus=available` for frontend, or add query param `forCatalog=true` that applies this filter.
- **Hide internal fields** — Optionally omit `approved`, `authNeeded`, `authenticationStatus`, `returnStatus`, etc. for frontend responses (or document which fields are backoffice-only in OpenAPI).
- **Add `GET /api/items/featured` or `?featured=true**` — For homepage highlights if you support it.

---

## 3. User Registration (Customer Signup)

**Current:** `createUser` requires full `address` (street, city, block, governorate, house). Heavy for customer signup.

**Improvements:**

- **Lighter address for customers** — Consider `addressText` (single string) for customers, or make address optional on first signup and collect at checkout.
- **Simplify `POST /api/auth/register**`— Required:`emailAddress`, `password`, `phoneNumber`. Optional: `fullName`, `address`(or`addressText`). Default `roles: ["user"]`.
- **Email uniqueness** — Already enforced by unique index. Return clear error if email exists.

---

## 4. Pagination and Performance

**Current:** List endpoints return all records (items, orders, reviews). Large datasets will slow responses.

**Improvements:**

- **Add pagination** — `limit`, `skip` or `page`, `limit` query params on `GET /api/items`, `GET /api/orders`, etc.
- **Default limit** — e.g. `limit=20` or `limit=50` to avoid huge responses.
- **Response shape** — `{ data, count, total, page, limit }` so frontend can build pagination UI.
- **Indexes** — Ensure indexes on `itemStatus`, `category_id`, `createdAt` for items; `user_id`, `createdAt` for orders.

---

## 5. Error Response Consistency

**Current:** Mix of `{ error }`, `{ success: false, error }`, `{ error, details }`. Some 404s omit `success`.

**Improvements:**

- **Standard shape** — `{ success: boolean, error?: string, code?: string, details?: any }` for all errors.
- **HTTP status** — 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 422 (validation), 500 (server).
- **Validation errors** — Return `details` array for field-level errors so frontend can show inline validation.

---

## 6. Security

**Current:** CORS allows all origins. No rate limiting. Debug middleware logs body/headers in non-production.

**Improvements:**

- **CORS** — Restrict `origin` in production to your frontend domain(s), e.g. `["https://yoursite.com", "https://www.yoursite.com"]`.
- **Rate limiting** — Add `express-rate-limit` for public endpoints (items, auth, discount validate) to prevent abuse.
- **Debug logging** — Ensure debug middleware is disabled in production (already gated by `NODE_ENV !== "production"`).
- **Sensitive data** — Never return `password` or hashed password in API responses. Verify `User` select/lean excludes it.
- **HTTPS** — Document that production must use HTTPS.

---

## 7. Discount Code Validation (Checkout)

**Current:** `POST /api/discountcodes/validate` with `{ code }` — good for checkout. Consider accepting `orderTotal` for validation (e.g. min order value).

**Improvements:**

- **Enhance validate** — Optional `orderTotal` to check min-spend rules if you add them.
- **Frontend-friendly response** — Already returns `{ valid, data: discountCode }`. Ensure `discount_percentage` is in the response for UI.

---

## 8. Orders and Checkout Flow

**Current:** `createOrder` requires `user_id`. No way for a guest to create an order without a pre-created user.

**Improvements:**

- **User context** — If using auth: derive `user_id` from JWT/session instead of body to prevent spoofing.
- **Order by user** — `GET /api/orders/user/:userId` should be protected: only that user or admin can access.
- **Create order** — Validate that `orderItems` item_ids exist and are `available` before creating.
- **Order total** — Once you implement `order_total` (from plan), return it in order responses for confirmation page.

---

## 9. Reviews

**Current:** `getReviewsByProductId` uses `productId` as `sellerId` — reviews are per seller, not per item. Route `/product/:productId` is misleading.

**Improvements:**

- **Clarify semantics** — Reviews are per seller. Either:
  - Rename `/product/:productId` to `/seller/:sellerId` (you already have `/seller/:sellerId`) and remove the product route, or
  - Add `item_id` to Review model and support item-level reviews.
- **Bug fix** — `getReviewsBySellerId` uses `req.params.userId` but route is `/seller/:sellerId`. Change to `req.params.sellerId`.
- **Create review** — Require auth so only logged-in users can post. Validate `userId` from session.

---

## 10. API Documentation for Frontend

**Current:** `docs/API_AND_FIELD_AUDIENCE.md` is referenced in OpenAPI but may not exist. Frontend docs are at `/api-docs/frontend`.

**Improvements:**

- **Create `docs/API_AND_FIELD_AUDIENCE.md**` — List which endpoints and fields are for frontend vs backoffice.
- **OpenAPI servers** — Add production server URL to `openapi.json` when you deploy.
- **SDK generation** — Use `openapi.json` or `/api-docs/frontend.json` to generate a TypeScript/JavaScript client for the frontend.
- **Example flows** — Document: Browse items → Add to cart (frontend state) → Checkout (create order) → Validate discount → Pay (gateway) → Order confirmation.

---

## 11. Health and Readiness

**Current:** `GET /` returns "API is working". No health check for DB or readiness.

**Improvements:**

- `**GET /health**` — Return 200 + `{ status: "ok" }`.
- `**GET /health/ready**` — Ping MongoDB; return 503 if DB is down. Useful for load balancers and K8s.

---

## 12. Environment and Deployment

**Current:** `.env` has `MONGODB_URI`, `PORT`. No production-oriented config.

**Improvements:**

- **Environment variables** — Document: `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET` (when you add auth), `CORS_ORIGIN` (optional), `FRONTEND_URL` for redirects.
- **.env.example** — Provide a template without secrets.

---

## Priority Summary

| Priority | Item                                        | Effort |
| -------- | ------------------------------------------- | ------ |
| High     | Auth: login + register + JWT                | Medium |
| High     | Items: default `available` for catalog      | Low    |
| High     | Protect user-scoped routes (orders by user) | Medium |
| Medium   | Pagination on items, orders                 | Low    |
| Medium   | Error response consistency                  | Low    |
| Medium   | Review bug fix (sellerId param)             | Low    |
| Medium   | CORS + rate limiting (production)           | Low    |
| Lower    | Health endpoints, SDK generation            | Low    |
| Lower    | Lighter customer signup (address optional)  | Medium |

Implement the high-priority items first for a workable customer-facing integration; then add pagination, security hardening, and docs.
