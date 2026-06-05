# Erlume Platform — Implementation Status
> Last updated: June 2026

---

## 1. Backend API (`backend-1.0`)

### Auth — `/api/auth`
| Method | Endpoint | Auth | Used by | Notes |
|--------|----------|------|---------|-------|
| POST | `/login` | Public | Frontend, Backoffice | Returns `accessToken` + `refreshToken` |
| POST | `/register` | Public | Frontend | Creates user with `user` role |
| POST | `/refresh` | Public | Frontend, Backoffice | Rotates refresh token pair |
| POST | `/logout` | Public | Frontend, Backoffice | Revokes refresh token |
| POST | `/forgot-password` | Public | Frontend | Sends OTP via WhatsApp |
| POST | `/reset-password` | Public | Frontend | Verifies OTP, updates password |
| GET | `/me` | JWT | Frontend, Backoffice | Returns current user |

### Items — `/api/items`
| Method | Endpoint | Auth | Used by | Notes |
|--------|----------|------|---------|-------|
| GET | `/` | Public | Frontend, Backoffice | 16 query filters, pagination (page/limit), search |
| GET | `/:id` | Public | Frontend, Backoffice | Single item with sellerId alias |
| POST | `/` | Admin | Backoffice | Creates item, links to seller |
| PUT/PATCH | `/:id` | Admin | Backoffice | Updates item, syncs seller.itemIds |
| DELETE | `/:id` | Admin | Backoffice | Cascade deletes OrderItems + OutfitItems |

**Item filters:** `search`, `brandName`, `itemStatus`, `condition`, `category_id`, `sub_category_id`, `drop_id`, `seller_id`, `minPrice`, `maxPrice`, `authenticationStatus`, `returnStatus`, `year`, `month`, `page`, `limit`

### Orders — `/api/orders`
| Method | Endpoint | Auth | Used by | Notes |
|--------|----------|------|---------|-------|
| POST | `/` | Public | Frontend, Backoffice | Registered user OR guest checkout |
| GET | `/` | Admin | Backoffice | All orders |
| GET | `/guest/:orderId?phone=` | Public | Frontend | Guest order lookup (phone verification) |
| GET | `/user/:userId` | JWT | Frontend | User's own orders |
| GET | `/:id` | JWT | Frontend, Backoffice | Single order with nested item details |
| PATCH | `/:id/status` | Admin | Backoffice | Updates status, triggers WhatsApp notification |
| PATCH | `/:id` | Admin | Backoffice | Updates delivery date, status, tracking |
| DELETE | `/:id` | Admin | Backoffice | Deletes order |
| POST | `/validate-cart` | Public | Frontend | Validates cart items before checkout |

**Guest checkout:** pass `guestInfo: { name, phoneNumber, emailAddress?, shippingAddress }` instead of `user_id`

### Users — `/api/users`
| Method | Endpoint | Auth | Used by |
|--------|----------|------|---------|
| GET | `/` | Admin | Backoffice |
| GET | `/:id` | JWT (self or admin) | Frontend, Backoffice |
| POST | `/` | Admin | Backoffice |
| PUT/PATCH | `/:id` | JWT (self or admin) | Frontend, Backoffice |
| PUT | `/:id/roles` | Admin | Backoffice |
| DELETE | `/:id` | Admin | Backoffice |

### Sellers — `/api/sellers`
| Method | Endpoint | Auth | Used by |
|--------|----------|------|---------|
| GET | `/` | Admin | Backoffice |
| GET | `/:id` | Admin | Backoffice |
| POST | `/` | Admin | Backoffice |
| PUT/PATCH | `/:id` | Admin | Backoffice |
| DELETE | `/:id` | Admin | Backoffice |

### Categories — `/api/categories` / Subcategories — `/api/sub-categories`
Public GET, Admin POST/PUT/DELETE. Used by Frontend + Backoffice.

### Drops — `/api/drops`
Admin only. Supports `bannerImageUrl`. Used by Backoffice (CRUD) + Frontend (GET list/by id).

### Discount Codes — `/api/discount-codes`
| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/validate` | Public | Accepts `{ code, orderTotal? }`, returns `discountPercentage`, `discountAmount`, `finalTotal` |
| GET/POST/PUT/DELETE | `/` | Admin | Backoffice CRUD |

### Outfits — `/api/outfits`
Admin only. Supports `coverImageUrl`. Full CRUD. Used by Backoffice only (frontend TBD).

### Upload — `/api/upload`
| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/` | Admin | Cloudinary upload. Folders: `items`, `receipts`, `price-estimators`, `quotes`, `drops`, `outfits` |

### Other Endpoints
| Route | Auth | Used by |
|-------|------|---------|
| `/api/enums` | Public | Frontend + Backoffice — item status, conditions, brands, governorates, cities |
| `/api/shipping` | Public GET, Admin CUD | Frontend (shipping options) + Backoffice |
| `/api/reviews` | Public GET, Auth POST | Frontend |
| `/api/newsletter` | Public POST, Admin GET | Frontend (subscribe), Backoffice (manage) |
| `/api/wishlist` | JWT | Frontend |
| `/api/transactions` | Admin | Backoffice |
| `/api/sales` | Admin | Backoffice |
| `/api/incomes` | Admin | Backoffice |
| `/api/expenses` | Admin | Backoffice |
| `/api/employees` | Admin | Backoffice |
| `/api/demands` | Admin | Backoffice |
| `/api/orderitems` | Admin | Backoffice |
| `/api/creditcards` | JWT | Backoffice |

---

### Notifications (WhatsApp via Twilio)
| Trigger | Recipient | Template |
|---------|-----------|---------|
| Order created | Buyer (registered or guest) | `erlume_order_confirmation` ✅ Approved |
| Order status → `shipped` | Buyer | `erlume_order_shipped` ✅ Approved |
| Order status → `delivered` | Buyer | `erlume_order_delivered` ✅ Approved |
| Other status changes | Buyer | Free-form (within conversation window) |
| Item `returnStatus` → `scheduled` | Seller | Free-form |
| Item `returnStatus` → `returned` | Seller | Free-form |
| Forgot password | User | Free-form OTP |

**Current sender:** Twilio sandbox `+14155238886` (free, testing only — recipients must join sandbox)
**Business sender ready:** `+15559837485` (blocked until Meta business verification — needs domain)

### Security
- JWT access tokens: **15 min** expiry
- Refresh tokens: **30 days**, stored in DB, rotated on use, revoked on logout
- Rate limits: Global 200/15min · Auth 20/15min · OTP 5/hour
- Helmet security headers
- CORS configurable via `ALLOWED_ORIGINS` env var

---

## 2. Backoffice (`erlume-backoffice`)

### Pages
| Page | What it does |
|------|-------------|
| **LoginPage** | JWT login, stores `accessToken` + `refreshToken`, auto-refresh on 401 |
| **DashboardPage** | KPI cards (static/placeholder — analytics endpoint not built yet) |
| **ItemsPage** | Full CRUD · Cloudinary image upload · Bulk status/condition/category update · Seller + drop assignment · 5-step form |
| **OrdersPage** | Create (registered user OR guest) · Update status/delivery/tracking · View order items with nested item details |
| **SellersPage** | Full CRUD · balance display |
| **UsersPage** | Full CRUD · role management |
| **CategoriesPage** | Full CRUD |
| **SubCategoriesPage** | Full CRUD · linked to category |
| **DropsPage** | Full CRUD · banner image upload via Cloudinary |
| **OutfitsPage** | Full CRUD · item selector |
| **DiscountsPage** | Full CRUD · active/inactive toggle |
| **TransactionsPage** | View only |
| **SalesPage** | View only |
| **IncomesPage** | Full CRUD |
| **ExpensesPage** | Full CRUD |
| **EmployeesPage** | Full CRUD |
| **ReviewsPage** | View + delete |
| **ShippingPage** | Full CRUD · shipping zones |
| **NewsletterPage** | View subscribers · active/inactive |
| **DemandsPage** | Full CRUD |
| **CreditCardsPage** | Full CRUD |

### Auth Flow
- Login → `accessToken` (15min) + `refreshToken` (30 days) stored in `localStorage`
- All API calls auto-inject `Bearer` token
- On 401 → silently refreshes token → retries request → redirects to login if refresh fails
- Logout → revokes refresh token on backend

---

## 3. Frontend (Not built yet — planned)

### Endpoints the frontend will use

#### Browsing & Discovery
| Endpoint | Purpose |
|----------|---------|
| `GET /api/items` | Shop page — filter by category, brand, price, condition, drop |
| `GET /api/items/:id` | Product detail page |
| `GET /api/categories` | Navigation menu |
| `GET /api/sub-categories` | Sub-navigation |
| `GET /api/drops` | Drops/collections page |
| `GET /api/outfits` | Outfit lookbook (TBD) |
| `GET /api/enums` | Populate filter dropdowns |

#### Auth
| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/register` | Sign up |
| `POST /api/auth/login` | Log in |
| `POST /api/auth/refresh` | Silent token refresh |
| `POST /api/auth/logout` | Log out |
| `POST /api/auth/forgot-password` | Request OTP via WhatsApp |
| `POST /api/auth/reset-password` | Submit OTP + new password |
| `GET /api/auth/me` | Load logged-in user profile |

#### Shopping
| Endpoint | Purpose |
|----------|---------|
| `POST /api/orders/validate-cart` | Validate items before checkout |
| `POST /api/discount-codes/validate` | Apply discount code |
| `POST /api/orders` | Place order (registered or guest) |
| `GET /api/orders/user/:userId` | Order history page |
| `GET /api/orders/:id` | Order detail / confirmation page |
| `GET /api/orders/guest/:orderId?phone=` | Guest order lookup |

#### Profile
| Endpoint | Purpose |
|----------|---------|
| `GET /api/users/:id` | View profile |
| `PUT /api/users/:id` | Update profile / address |
| `GET /api/wishlist` | Wishlist page |
| `POST /api/wishlist` | Add to wishlist |
| `DELETE /api/wishlist/:id` | Remove from wishlist |

#### Other
| Endpoint | Purpose |
|----------|---------|
| `GET /api/shipping` | Show shipping options at checkout |
| `POST /api/newsletter` | Newsletter subscribe |
| `GET /api/reviews` | Product reviews |
| `POST /api/reviews` | Submit review |

---

## 4. What's Not Built Yet

### No domain needed
| Feature | Notes |
|---------|-------|
| **Analytics endpoint** | Revenue by period, top items, orders by status — for backoffice dashboard |
| **Payment gateway** | Tap Payments or MyFatoorah — required for real transactions |
| **Seller payout tracking** | Mark payouts as paid, payout history per seller |
| **Invoice generation** | PDF receipt stored on Cloudinary, link sent to buyer |

### Needs domain first
| Feature | Blocker |
|---------|---------|
| **Email notifications** | Domain → ZeptoMail/Zoho setup |
| **Invoice email to buyer** | Domain → ZeptoMail |
| **WhatsApp live business sender** | Domain → Meta business verification → `+15559837485` active |
| **Password reset via email** | Domain → ZeptoMail (WhatsApp OTP works as fallback now) |

### Frontend (entire app)
Not started. Will use the endpoints listed in Section 3.
