# Erlume Backend

Express.js + TypeScript + MongoDB REST API.

---

## Setup

```sh
npm install
```

Create a `.env` file in the root:

```env
MONGODB_URI=mongodb://localhost:27017/erlumedb
PORT=3000
JWT_SECRET=change_me_in_production_use_a_long_random_string
JWT_EXPIRES_IN=7d

# Twilio — WhatsApp order notifications
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=+14155238886
```

```sh
# Build and start
npm run build
npm start

# Dev mode with hot reload
npm run start:dev
```

API is available at `http://localhost:3000`.

---

## Create an admin account

No admin is created on first run. Use this one-liner (replace the placeholders):

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

> Role values are lowercase: `admin`, `user`, `seller`.

---

## Backoffice login

A login page is served by the backend at:

```
http://localhost:3000/backoffice
```

It authenticates, checks for the `admin` role, and auto-injects the Bearer token into Swagger.

---

## API docs (Swagger)

| URL | Audience |
|-----|----------|
| `http://localhost:3000/api-docs` | Full — all endpoints |
| `http://localhost:3000/api-docs/backoffice` | Admin endpoints only |
| `http://localhost:3000/api-docs/frontend` | Public + auth endpoints |
| `http://localhost:3000/api-docs.json` | Raw OpenAPI JSON |

To test protected endpoints manually in Swagger:
1. Call `POST /api/auth/login` and copy the `token` from the response.
2. Click **Authorize** (top right), paste the token (**no** `Bearer` prefix), click **Authorize**.

---

## Auth

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Returns JWT token |
| GET | `/api/auth/me` | Auth | Current user info |

---

## Route access levels

| Route prefix | Access |
|---|---|
| `/api/auth` | Public |
| `/api/items`, `/api/categories`, `/api/sub-categories` | Public |
| `/api/reviews`, `/api/enums` | Public |
| `/api/shipping` | Public (read) / Admin (write) |
| `/api/newsletter` | Public (subscribe/unsubscribe) / Admin (list) |
| `/api/discount-codes` | Public (validate) / Admin (CRUD) |
| `/api/orders` | Auth — own orders / Admin — all orders |
| `/api/users` | Auth — own profile / Admin — all users |
| `/api/creditcards`, `/api/wishlist` | Auth |
| `/api/transactions`, `/api/sales`, `/api/incomes` | Admin only |
| `/api/expenses`, `/api/employees`, `/api/sellers` | Admin only |
| `/api/drops`, `/api/demands`, `/api/outfits`, `/api/outfititems` | Admin only |

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled server (`dist/server.js`) |
| `npm run start:dev` | Dev mode with hot reload |
| `npm run sync-db` | Sync collections and indexes |
| `npm run bulk-import-sellers` | Bulk import sellers from file |
| `npm run bulk-import-items` | Bulk import items from file |
