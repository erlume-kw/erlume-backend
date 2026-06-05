const fs = require("fs");
const s = JSON.parse(fs.readFileSync("./openapi.json", "utf-8"));

// ── 1. GET /api/items ──────────────────────────────────────────────────────
s.paths["/api/items"].get.parameters = [
  { name: "search", in: "query", schema: { type: "string" }, description: "Search by item name or brand (case-insensitive)" },
  { name: "brandName", in: "query", schema: { type: "string" }, description: "Exact brand filter (case-insensitive)" },
  { name: "itemStatus", in: "query", schema: { type: "string", enum: ["available", "sold", "pending", "reserved"] }, description: "Frontend should always pass available" },
  { name: "condition", in: "query", schema: { type: "string", enum: ["new", "like_new", "gently_used", "fair", "worn"] } },
  { name: "category_id", in: "query", schema: { type: "string" }, description: "MongoDB ObjectId" },
  { name: "sub_category_id", in: "query", schema: { type: "string" } },
  { name: "drop_id", in: "query", schema: { type: "string" } },
  { name: "seller_id", in: "query", schema: { type: "string" } },
  { name: "minPrice", in: "query", schema: { type: "number" }, description: "Minimum listing price (KWD)" },
  { name: "maxPrice", in: "query", schema: { type: "number" }, description: "Maximum listing price (KWD)" },
  { name: "authenticationStatus", in: "query", schema: { type: "string", enum: ["pending", "authentic", "not_authentic"] } },
  { name: "returnStatus", in: "query", schema: { type: "string" } },
  { name: "year", in: "query", schema: { type: "integer" }, description: "Filter by uploadedAt year" },
  { name: "month", in: "query", schema: { type: "integer", minimum: 1, maximum: 12 } },
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
];
s.paths["/api/items"].get.responses["200"] = {
  description: "OK",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "array", items: { type: "object" } },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              totalCount: { type: "integer" },
              totalPages: { type: "integer" },
              hasNextPage: { type: "boolean" },
              hasPrevPage: { type: "boolean" },
            },
          },
        },
      },
    },
  },
};

// ── 2. POST /api/orders — guest checkout ──────────────────────────────────
s.paths["/api/orders"].post.requestBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        oneOf: [
          {
            title: "Registered user order",
            type: "object",
            required: ["user_id", "orderItems"],
            properties: {
              user_id: { type: "string", description: "MongoDB ObjectId of registered user" },
              orderItems: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  required: ["item_id"],
                  properties: {
                    item_id: { type: "string" },
                    quantity: { type: "integer", minimum: 1 },
                    is_returned: { type: "boolean" },
                  },
                },
              },
              order_status: { type: "string" },
            },
          },
          {
            title: "Guest order",
            type: "object",
            required: ["guestInfo", "orderItems"],
            properties: {
              guestInfo: {
                type: "object",
                required: ["name", "phoneNumber", "shippingAddress"],
                properties: {
                  name: { type: "string" },
                  phoneNumber: { type: "string", example: "+96512345678" },
                  emailAddress: { type: "string", format: "email" },
                  shippingAddress: {
                    type: "object",
                    required: ["street", "city", "block", "governorate", "house"],
                    properties: {
                      street: { type: "string" },
                      city: { type: "string" },
                      block: { type: "string" },
                      governorate: { type: "string" },
                      house: { type: "string" },
                      flat: { type: "string" },
                    },
                  },
                },
              },
              orderItems: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  required: ["item_id"],
                  properties: {
                    item_id: { type: "string" },
                    quantity: { type: "integer", minimum: 1 },
                    is_returned: { type: "boolean" },
                  },
                },
              },
              order_status: { type: "string" },
            },
          },
        ],
      },
    },
  },
};

// ── 3. GET /api/orders/guest/{orderId} ────────────────────────────────────
s.paths["/api/orders/guest/{orderId}"] = {
  get: {
    tags: ["Orders"],
    summary: "Get guest order (phone verification required)",
    parameters: [
      { name: "orderId", in: "path", required: true, schema: { type: "string" } },
      { name: "phone", in: "query", required: true, schema: { type: "string" }, description: "Must match the phone used at checkout" },
    ],
    responses: {
      "200": { description: "Order with populated item details" },
      "403": { description: "Phone number does not match" },
      "404": { description: "Order not found" },
    },
    "x-usedBy": ["frontend"],
    security: [],
  },
};

// ── 4. POST /api/discount-codes/validate ──────────────────────────────────
s.paths["/api/discount-codes/validate"].post.requestBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string", example: "ERLUME20" },
          orderTotal: { type: "string", description: "Cart total in KWD. If provided, discountAmount and finalTotal are returned.", example: "125.000" },
        },
      },
    },
  },
};
s.paths["/api/discount-codes/validate"].post.responses["200"] = {
  description: "Code is valid",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          valid: { type: "boolean" },
          discountPercentage: { type: "number", example: 20 },
          discountAmount: { type: "string", description: "Only present when orderTotal was provided", example: "25.000" },
          finalTotal: { type: "string", description: "Only present when orderTotal was provided", example: "100.000" },
          data: {
            type: "object",
            properties: {
              code: { type: "string" },
              discount_percentage: { type: "string" },
              expiry_date: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  },
};
s.paths["/api/discount-codes/validate"].post["x-usedBy"] = ["frontend", "backoffice"];

// ── 5. POST/PUT /api/drops — bannerImageUrl ───────────────────────────────
const dropSchema = {
  type: "object",
  required: ["name", "releaseDate", "status"],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    releaseDate: { type: "string", format: "date" },
    status: { type: "string", enum: ["upcoming", "active", "completed"] },
    bannerImageUrl: { type: "string", format: "uri", description: "Cloudinary URL for the drop banner image" },
  },
};
s.paths["/api/drops"].post.requestBody = { required: true, content: { "application/json": { schema: dropSchema } } };
s.paths["/api/drops/{id}"].put.requestBody = { required: true, content: { "application/json": { schema: { ...dropSchema, required: [] } } } };

// ── 6. POST/PUT /api/outfits — coverImageUrl ──────────────────────────────
const outfitSchema = {
  type: "object",
  required: ["item_ids", "outfit_title", "outfit_tags"],
  properties: {
    item_ids: { type: "array", items: { type: "string" } },
    outfit_title: { type: "string" },
    outfit_tags: { type: "string" },
    coverImageUrl: { type: "string", format: "uri", description: "Cloudinary URL for the outfit cover photo" },
  },
};
s.paths["/api/outfits"].post.requestBody = { required: true, content: { "application/json": { schema: outfitSchema } } };
s.paths["/api/outfits/{id}"].put.requestBody = { required: true, content: { "application/json": { schema: { ...outfitSchema, required: [] } } } };

// ── 7. Auth — missing endpoints ───────────────────────────────────────────
s.paths["/api/auth/refresh"] = {
  post: {
    tags: ["Auth"],
    summary: "Refresh access token",
    "x-usedBy": ["frontend", "backoffice"],
    security: [],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["refreshToken"],
            properties: {
              refreshToken: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "New access + refresh token pair",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: { type: "boolean" },
                accessToken: { type: "string" },
                refreshToken: { type: "string" },
              },
            },
          },
        },
      },
      "401": { description: "Invalid or expired refresh token" },
    },
  },
};

s.paths["/api/auth/logout"] = {
  post: {
    tags: ["Auth"],
    summary: "Logout and revoke refresh token",
    "x-usedBy": ["frontend", "backoffice"],
    security: [],
    requestBody: {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              refreshToken: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      "200": { description: "Logged out successfully" },
    },
  },
};

s.paths["/api/auth/forgot-password"] = {
  post: {
    tags: ["Auth"],
    summary: "Request password reset OTP via WhatsApp",
    "x-usedBy": ["frontend"],
    security: [],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["phoneNumber"],
            properties: {
              phoneNumber: { type: "string", example: "+96597226735" },
            },
          },
        },
      },
    },
    responses: {
      "200": { description: "OTP sent if number is registered (always 200 to avoid leaking)" },
      "429": { description: "Too many requests — max 5 per hour" },
    },
  },
};

s.paths["/api/auth/reset-password"] = {
  post: {
    tags: ["Auth"],
    summary: "Reset password using WhatsApp OTP",
    "x-usedBy": ["frontend"],
    security: [],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["phoneNumber", "otp", "newPassword"],
            properties: {
              phoneNumber: { type: "string", example: "+96597226735" },
              otp: { type: "string", example: "482910", description: "6-digit code received via WhatsApp" },
              newPassword: { type: "string", minLength: 8, example: "newpassword123" },
            },
          },
        },
      },
    },
    responses: {
      "200": { description: "Password reset successfully — all sessions invalidated" },
      "400": { description: "Invalid or expired OTP" },
      "429": { description: "Too many requests — max 5 per hour" },
    },
  },
};

// Update existing auth login response to reflect new token field names
s.paths["/api/auth/login"].post.responses["200"] = {
  description: "Login successful",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          accessToken: { type: "string", description: "Short-lived JWT (15 min)" },
          refreshToken: { type: "string", description: "Long-lived opaque token (30 days)" },
          user: {
            type: "object",
            properties: {
              _id: { type: "string" },
              emailAddress: { type: "string" },
              roles: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  },
};

// ── Write ──────────────────────────────────────────────────────────────────
fs.writeFileSync("./openapi.json", JSON.stringify(s, null, 2));
console.log("openapi.json updated successfully");
