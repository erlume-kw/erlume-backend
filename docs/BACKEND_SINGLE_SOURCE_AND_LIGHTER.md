# Backend: Lighter & Single Source of Truth

Short, actionable ideas so the API stays one contract for every client that consumes it.

---

## 1. **OpenAPI as the contract**

- **Done:** One `openapi.json` and Swagger UI at `/api-docs` (JSON at `/api-docs.json`). No path-level audience split.
- **Do:** Generate client SDKs from `openapi.json` (e.g. OpenAPI Generator, or fetch `/api-docs.json` at build time). Same spec → same types and endpoints everywhere.
- **Fix:** Removed obsolete `/api/users/{id}/seller` from the spec; all seller updates go through **`/api/sellers/{id}`** (PUT/PATCH) so the spec matches the code.

---

## 2. **One way to update sellers**

- **Current:** Seller updates are only on **`/api/sellers/:id`** (userController.updateSellerInfo). User routes no longer expose `/users/:id/seller`.
- **Recommendation:** In all clients, always call `PATCH /api/sellers/{id}` (id = seller document _id or user ID). Document this in your API docs and client code so nobody reintroduces a “update seller by user” path elsewhere.

---

## 3. **REST vs GraphQL**

- **Current (this repo):** **REST only** (Express + MongoDB). There is no GraphQL server in `backend-1.0`; `openapi.json` is the contract.
- **If you add GraphQL elsewhere:** Prefer **REST + OpenAPI as the single source of truth** for this API. If another service exposes GraphQL, document it separately and avoid duplicating the same reads/writes in two layers.

---

## 4. **Sale vs Income**

- **Sale:** Invoice/evidence (order_id, order_item_id, transaction_id, invoice_number, invoice_url, payment_evidence_url). Created when an order is completed.
- **Income:** Financial breakdown (amount, erlumeCommissionAmount, sellerPayoutAmount, etc.). Single source for commission and payout.
- **Recommendation:** Keep both but document clearly: **Income = single source of truth for money**; **Sale = single source for evidence/attachments**. Prefer Income for reports and payouts; use Sale when you need invoice/evidence. No need to merge unless you want one “post-sale record” type that holds both.

---

## 5. **Enums and lists**

- **Current:** `GET /api/enums` and `GET /api/enums/:category` (e.g. itemStatus, order_status, authenticationStatus).
- **Single source:** All clients should load dropdown/options from these endpoints instead of hardcoding. OpenAPI tags Enums; keep one enum list in the backend and reference it in the spec.

---

## 6. **Small technical wins**

- **Validation:** Zod middleware on most mutating routes; e.g. `POST /api/sales/recalculate-commissions` (empty body only) and `PATCH /api/outfititems/:id/featured` (optional `featured` boolean). Extend schemas where gaps remain.
- **Errors:** `sendError(res, status, message, code?)` in `src/utils/sendError.ts` — used in outfit-item featured toggle and sales recalculate; validation middleware already returns `code` + `details` for Zod failures. Roll out to other controllers gradually.
- **Ids:** Document that “seller id” can be either seller document `_id` or `userId` where your code supports it (e.g. getSellerById), and stick to that in the spec and docs.

---

## Summary

| Area              | Action |
|-------------------|--------|
| **Contract**      | OpenAPI = single spec; generate clients from it; removed `/api/users/{id}/seller` from spec. |
| **Sellers**       | Single path: `PATCH /api/sellers/{id}`. |
| **GraphQL**       | Not used in this backend; REST + OpenAPI only. |
| **Money vs evidence** | Income = money truth; Sale = evidence; document and use consistently. |
| **Enums**         | Both apps use `GET /api/enums` (and category) as single source for options. |
| **Validation & errors** | Zod on most routes; `sendError` helper started (outfit featured, sales recalculate). |

This keeps the backend lighter and makes the same API the single source of truth for every client.
