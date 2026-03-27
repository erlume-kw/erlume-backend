# backend-1.0

Backend using ExpressJS and MongoDB

## ⚙️ Setup Instructions

```sh
# Install dependencies
npm install

# Create .env file
touch .env
```

Add to `.env`:
```
MONGODB_URI=your-mongodb-uri
PORT=3000
```

```sh
# Start the server (build and run)
npm run build-and-run

# Or dev mode with hot reload
npm run start:dev
```

Visit http://localhost:3000 to test.

## 📚 API docs (Swagger)

| URL | Description |
|-----|-------------|
| `/api-docs` | Full Swagger UI |
| `/api-docs.json` | Raw OpenAPI spec |

## 🗄️ Database

Whenever you make changes to a model, restart the server for changes to take effect:

```sh
npm run build-and-run
```

### Useful scripts

| Script | Description |
|--------|-------------|
| `npm run sync-db` | Sync database collections and indexes |
| `npm run bulk-import-sellers` | Import sellers in bulk |
| `npm run bulk-import-items` | Import items in bulk |
| `npm run bulk-import-csv-data` | Import data from CSV |
| `npm run add-seller` | Add a single seller |

## 📡 API Endpoints

All routes are prefixed with `/api`.

### Users
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `PUT /api/users/:id/seller`

### Sellers
- `GET /api/sellers`
- `GET /api/sellers/:id`
- `POST /api/sellers`
- `PUT /api/sellers/:id`
- `PATCH /api/sellers/:id`
- `DELETE /api/sellers/:id`

### Items
- `GET /api/items`
- `GET /api/items/:id`
- `POST /api/items`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`

### Categories
- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Sub-Categories
- `GET /api/sub-categories`
- `GET /api/sub-categories/:id`
- `POST /api/sub-categories`
- `PUT /api/sub-categories/:id`
- `DELETE /api/sub-categories/:id`

### Orders
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`

### Order Items
- `GET /api/orderitems`
- `GET /api/orderitems/:id`
- `POST /api/orderitems`
- `PUT /api/orderitems/:id`
- `DELETE /api/orderitems/:id`

### Transactions
- `GET /api/transactions`
- `GET /api/transactions/:id`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Sales
- `GET /api/sales`
- `GET /api/sales/:id`
- `GET /api/sales/order/:orderId`
- `POST /api/sales`
- `POST /api/sales/recalculate-commissions`
- `PUT /api/sales/:id`
- `PATCH /api/sales/:id`
- `DELETE /api/sales/:id`

### Incomes
- `GET /api/incomes`
- `GET /api/incomes/:id`
- `POST /api/incomes`
- `PUT /api/incomes/:id`
- `PATCH /api/incomes/:id`
- `DELETE /api/incomes/:id`

### Expenses
- `GET /api/expenses`
- `GET /api/expenses/:id`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`

### Credit Cards
- `GET /api/creditcards`
- `GET /api/creditcards/:id`
- `POST /api/creditcards`
- `PUT /api/creditcards/:id`
- `DELETE /api/creditcards/:id`

### Reviews
- `GET /api/reviews`
- `GET /api/reviews/:id`
- `POST /api/reviews`
- `PUT /api/reviews/:id`
- `DELETE /api/reviews/:id`

### Drops
- `GET /api/drops`
- `GET /api/drops/:id`
- `POST /api/drops`
- `PUT /api/drops/:id`
- `DELETE /api/drops/:id`
- `GET /api/drops/:id/items`
- `POST /api/drops/:id/items`
- `DELETE /api/drops/:id/items/:itemId`

### Demands
- `GET /api/demands`
- `GET /api/demands/:id`
- `POST /api/demands`
- `PUT /api/demands/:id`
- `DELETE /api/demands/:id`

### Discount Codes
- `GET /api/discount-codes`
- `GET /api/discount-codes/:id`
- `POST /api/discount-codes`
- `PUT /api/discount-codes/:id`
- `DELETE /api/discount-codes/:id`

### Outfits
- `GET /api/outfits`
- `GET /api/outfits/:id`
- `POST /api/outfits`
- `PUT /api/outfits/:id`
- `DELETE /api/outfits/:id`

### Outfit Items
- `GET /api/outfititems`
- `GET /api/outfititems/:id`
- `POST /api/outfititems`
- `PUT /api/outfititems/:id`
- `DELETE /api/outfititems/:id`

### Employees
- `GET /api/employees`
- `GET /api/employees/:id`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `PATCH /api/employees/:id`
- `DELETE /api/employees/:id`

### Enums
- `GET /api/enums`
- `GET /api/enums/:category`

### Useful Tips
- Always check your MongoDB connection string in the .env file to ensure it's correct.
