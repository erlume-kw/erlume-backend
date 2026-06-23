# Erlume Backend

Express.js + TypeScript + MongoDB REST API for the Erlume luxury resale marketplace.

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** running locally or a MongoDB Atlas connection string
- A **Cloudinary** account (free tier is fine)
- A **Twilio** account with WhatsApp sandbox enabled (for order notifications)

---

## 1. Install dependencies

```sh
npm install
```

---

## 2. Create `.env`

Create a `.env` file in the root of the project:

```env
# MongoDB — pick one and comment out the other

# Local (development):
MONGODB_URI=mongodb://localhost:27017/erlumedb

# Cloud / Atlas (production):
# Get the full connection string (with credentials) from the team Discord
# MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@erlume.fuwodvo.mongodb.net/?appName=erlume

# Server
PORT=3000

# Auth — use long random strings in production
JWT_SECRET=change_me_in_production_use_a_long_random_string
REFRESH_TOKEN_SECRET=change_me_refresh_secret_use_a_different_long_random_string

# Cloudinary — image uploads (get from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Twilio — WhatsApp notifications (get from twilio.com console)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=+14155238886            # Sandbox number (free)
TWILIO_MESSAGING_SERVICE_SID=your_msg_sid   # Only needed for business sender
```

> **WhatsApp sandbox:** buyers must send `join <keyword>` to `+1 415 523 8886` on WhatsApp before they can receive sandbox messages. Check your Twilio console for the keyword.

---

## 3. Run the server

```sh
# Build TypeScript → dist/ then start
npm run build
npm start

# Development mode with hot reload (no build needed)
npm run start:dev
```

API is available at `http://localhost:3000`.

---

## 4. Create the first admin account

No admin is created on first run. Run this script once (replace placeholders):

```sh
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hash = await bcrypt.hash('YOUR_PASSWORD', 12);
  await mongoose.connection.db.collection('users').insertOne({
    emailAddress: 'YOUR_EMAIL',
    password: hash,
    phoneNumber: '+96500000000',
    address: { street: 'Main St', city: 'Kuwait City', block: '1', governorate: 'Al Asimah', house: '1' },
    roles: ['admin'],
    cardIds: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Admin created');
  process.exit(0);
});
"
```

> Role values are lowercase: `admin`, `user`, `seller`

---

## 5. Backoffice login page

Served directly by the backend at:

```
http://localhost:3000/backoffice
```

Authenticates, checks for the `admin` role, and auto-injects the Bearer token into Swagger UI.

---

## 6. API docs (Swagger)

| URL | Audience |
|-----|----------|
| `http://localhost:3000/api-docs` | Full — all endpoints |
| `http://localhost:3000/api-docs/backoffice` | Admin endpoints only |
| `http://localhost:3000/api-docs/frontend` | Public + buyer endpoints |
| `http://localhost:3000/api-docs.json` | Raw OpenAPI JSON |

**To test protected endpoints in Swagger:**
1. Call `POST /api/auth/login` → copy `accessToken` from the response
2. Click **Authorize** (top right) → paste token (**no** `Bearer` prefix) → click **Authorize**

---

## Auth endpoints

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | Public | Create account, returns `accessToken` + `refreshToken` |
| POST | `/api/auth/login` | Public | Returns `accessToken` (15 min) + `refreshToken` (30 days) |
| POST | `/api/auth/refresh` | Public | Exchange refresh token for new pair |
| POST | `/api/auth/logout` | Public | Revoke refresh token |
| POST | `/api/auth/forgot-password` | Public | Send OTP via WhatsApp (5/hour rate limit) |
| POST | `/api/auth/reset-password` | Public | Verify OTP and set new password |
| GET  | `/api/auth/me` | JWT | Current user profile |

---

## Route access levels

| Route prefix | Access |
|---|---|
| `/api/auth` | Public |
| `/api/items`, `/api/categories`, `/api/sub-categories` | Public |
| `/api/reviews`, `/api/enums`, `/api/shipping` | Public (read) |
| `/api/newsletter` | Public (subscribe) / Admin (list) |
| `/api/discount-codes` | Public (validate) / Admin (CRUD) |
| `/api/orders` | Public (create + guest lookup) / JWT (own orders) / Admin (all) |
| `/api/users` | JWT (own profile) / Admin (all users) |
| `/api/creditcards`, `/api/wishlist` | JWT |
| `/api/sellers`, `/api/payouts` | Admin only |
| `/api/transactions`, `/api/sales`, `/api/incomes` | Admin only |
| `/api/expenses`, `/api/employees`, `/api/demands` | Admin only |
| `/api/drops`, `/api/outfits`, `/api/outfititems` | Admin only |
| `/api/upload` | Admin only |

---

## Rate limits

| Scope | Limit |
|---|---|
| Global | 200 requests / 15 min per IP |
| Auth endpoints | 20 requests / 15 min per IP |
| OTP (forgot/reset password) | 5 requests / hour per IP |

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled server (`dist/server.js`) |
| `npm run start:dev` | Dev mode with hot reload |
| `npm run sync-db` | Sync MongoDB collections and indexes |
| `npm run bulk-import-sellers` | Bulk import sellers from file |
| `npm run bulk-import-items` | Bulk import items from file |
| `node scripts/update-openapi.js` | Regenerate `openapi.json` after API changes |
