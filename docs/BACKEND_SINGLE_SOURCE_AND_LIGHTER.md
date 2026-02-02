# Backend: Lighter & Single Source of Truth (Frontend + Backoffice)

Short, actionable ideas so the API stays one source of truth for both the customer frontend and the backoffice.

---

## 1. **OpenAPI as the contract**

- **Done:** One `openapi.json` with `x-usedBy` (backoffice / frontend) and filtered Swagger at `/api-docs`, `/api-docs/backoffice`, `/api-docs/frontend`.
- **Do:** Generate client SDKs from `openapi.json` for frontend and backoffice (e.g. OpenAPI Generator, or fetch `/api-docs.json` at build time). Same spec → same types and endpoints everywhere.
- **Fix:** Removed obsolete `/api/users/{id}/seller` from the spec; all seller updates go through **`/api/sellers/{id}`** (PUT/PATCH) so the spec matches the code.

---

## 2. **One way to update sellers**

- **Current:** Seller updates are only on **`/api/sellers/:id`** (userController.updateSellerInfo). User routes no longer expose `/users/:id/seller`.
- **Recommendation:** In backoffice/frontend, always call `PATCH /api/sellers/{id}` (id = seller document _id or user ID). Document this in your API docs and client code so nobody reintroduces a “update seller by user” path elsewhere.

---

## 3. **REST vs GraphQL**

- **Current:** REST (Express) + GraphQL (Apollo) in the same server. GraphQL exposes generic `findAll`/`findById` and a few specific queries (e.g. `usersTable`, `itemsTable`, `ordersTable`, `dashboardKpis`).
- **Lighter options:**
  - **Option A (recommended):** Treat **REST + OpenAPI as the single source of truth**. Use REST for all CRUD and business operations. If GraphQL is only for a couple of backoffice screens, reimplement those with REST (e.g. `GET /api/dashboard/kpis`, `GET /api/users` with query params). Then remove or slim down GraphQL to reduce surface and duplication.
  - **Option B:** If you keep GraphQL, restrict it to backoffice (e.g. behind `x-admin-token`), document it as “admin only”, and don’t use it from the frontend. Frontend uses only REST from the spec.

---

## 4. **Sale vs Income**

- **Sale:** Invoice/evidence (order_id, order_item_id, transaction_id, invoice_number, invoice_url, payment_evidence_url). Created when an order is completed.
- **Income:** Financial breakdown (amount, erlumeCommissionAmount, sellerPayoutAmount, etc.). Single source for commission and payout.
- **Recommendation:** Keep both but document clearly: **Income = single source of truth for money**; **Sale = single source for evidence/attachments**. In backoffice, prefer Income for reports and payouts; use Sale when you need invoice/evidence. No need to merge unless you want one “post-sale record” type that holds both.

---

## 5. **Enums and lists**

- **Current:** `GET /api/enums` and `GET /api/enums/:category` (e.g. itemStatus, order_status, authenticationStatus).
- **Single source:** Both frontend and backoffice should load dropdown/options from these endpoints instead of hardcoding. OpenAPI already tags Enums; keep one enum list in the backend and reference it in the spec.

---

## 6. **Small technical wins**

- **Validation:** Add a shared request validation layer (e.g. schemas from OpenAPI or Zod) so invalid bodies are rejected early with clear messages. Same rules for frontend and backoffice calls.
- **Errors:** Use a consistent JSON error shape (e.g. `{ success: false, error: string, code?: string }`) in all controllers so clients can handle them uniformly.
- **Ids:** Document that “seller id” can be either seller document `_id` or `userId` where your code supports it (e.g. getSellerById), and stick to that in the spec and docs.

---

## Summary

| Area              | Action |
|-------------------|--------|
| **Contract**      | OpenAPI = single spec; generate clients from it; removed `/api/users/{id}/seller` from spec. |
| **Sellers**       | Single path: `PATCH /api/sellers/{id}`. |
| **GraphQL**       | Prefer REST-only and trim GraphQL, or keep GraphQL backoffice-only. |
| **Money vs evidence** | Income = money truth; Sale = evidence; document and use consistently. |
| **Enums**         | Both apps use `GET /api/enums` (and category) as single source for options. |
| **Validation & errors** | Shared validation and error format for all consumers. |

This keeps the backend lighter and makes the same API the single source of truth for both frontend and backoffice.
