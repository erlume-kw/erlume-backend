"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const db_1 = __importStar(require("./config/db"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_1 = require("./middleware/errorHandler");
// Import routes
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const itemRoutes_1 = __importDefault(require("./routes/itemRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const subCategoryRoutes_1 = __importDefault(require("./routes/subCategoryRoutes"));
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const orderItemRoutes_1 = __importDefault(require("./routes/orderItemRoutes"));
const creditCardRoutes_1 = __importDefault(require("./routes/creditCardRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const saleRoutes_1 = __importDefault(require("./routes/saleRoutes"));
const outfitRoutes_1 = __importDefault(require("./routes/outfitRoutes"));
const outfitItemRoutes_1 = __importDefault(require("./routes/outfitItemRoutes"));
const demandRoutes_1 = __importDefault(require("./routes/demandRoutes"));
const discountCodeRoutes_1 = __importDefault(require("./routes/discountCodeRoutes"));
const dropRoutes_1 = __importDefault(require("./routes/dropRoutes"));
const enumRoutes_1 = __importDefault(require("./routes/enumRoutes"));
const sellerRoutes_1 = __importDefault(require("./routes/sellerRoutes"));
const incomeRoutes_1 = __importDefault(require("./routes/incomeRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const payoutRoutes_1 = __importDefault(require("./routes/payoutRoutes"));
const wishlistRoutes_1 = __importDefault(require("./routes/wishlistRoutes"));
const shippingRoutes_1 = __importDefault(require("./routes/shippingRoutes"));
const newsletterRoutes_1 = __importDefault(require("./routes/newsletterRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const auth_1 = require("./middleware/auth");
const userEnums_1 = require("./enums/userEnums");
const node_schedule_1 = __importDefault(require("node-schedule"));
const verificationService_1 = require("./services/verificationService");
dotenv_1.default.config();
// Add unhandled error handlers
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});
const app = (0, express_1.default)();
// Security headers
app.use((0, helmet_1.default)());
// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : true; // dev: allow all
const corsOptions = {
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use((0, cors_1.default)(corsOptions));
// Global rate limit — 200 req / 15 min per IP
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Stricter rate limit for auth endpoints
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});
// JSON body parser - handle empty bodies gracefully
app.use(express_1.default.json({
    limit: "10mb",
    strict: false, // Allow non-object JSON (arrays, strings, etc.)
}));
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
// Ensure preflight requests always get a CORS response
app.options(/.*/, (0, cors_1.default)(corsOptions));
// Debug middleware (after body parsing so req.body is populated)
const isDebug = process.env.NODE_ENV !== "production";
if (isDebug) {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        console.log("Headers:", req.headers);
        console.log("Body:", req.body);
        next();
    });
}
// Base route
app.get("/", (req, res) => {
    res.send("API is working");
});
// Backoffice login page
app.get("/backoffice", (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Erlume Backoffice</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #111;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    .card {
      background: #1a1a1a;
      padding: 48px 40px;
      width: 100%;
      max-width: 360px;
    }
    .logo {
      display: block;
      color: #fff;
      font-size: 20px;
      letter-spacing: 5px;
      font-weight: 300;
      margin-bottom: 36px;
    }
    label {
      display: block;
      color: #666;
      font-size: 11px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    input {
      display: block;
      width: 100%;
      background: #111;
      border: 1px solid #2e2e2e;
      color: #fff;
      padding: 11px 13px;
      font-size: 14px;
      outline: none;
      margin-bottom: 20px;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #555; }
    button {
      width: 100%;
      background: #fff;
      color: #111;
      border: none;
      padding: 13px;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      cursor: pointer;
      font-weight: 600;
      margin-top: 4px;
      transition: background 0.2s;
    }
    button:hover:not(:disabled) { background: #e0e0e0; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .error {
      color: #e05c5c;
      font-size: 12px;
      margin-top: 14px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="logo">ERLUME</span>
    <form id="form">
      <label>Email</label>
      <input id="email" type="email" autocomplete="email" required />
      <label>Password</label>
      <input id="password" type="password" autocomplete="current-password" required />
      <button id="btn" type="submit">Sign in</button>
      <p id="error" class="error"></p>
    </form>
  </div>
  <script>
    // If already authenticated, go straight to backoffice
    try {
      const stored = JSON.parse(localStorage.getItem('authorized') || '{}');
      if (stored.bearerAuth?.value) window.location.replace('/api-docs/backoffice');
    } catch (_) {}

    document.getElementById('form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = document.getElementById('btn');
      const errorEl = document.getElementById('error');
      btn.textContent = 'Signing in…';
      btn.disabled = true;
      errorEl.style.display = 'none';
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailAddress: document.getElementById('email').value,
            password: document.getElementById('password').value,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.token) throw new Error(data.error || 'Invalid credentials');
        const roles = (data.user && data.user.roles) || [];
        if (!roles.includes('admin')) throw new Error('Access restricted to admins');
        localStorage.setItem('authorized', JSON.stringify({
          bearerAuth: { name: 'bearerAuth', schema: { type: 'http', scheme: 'bearer' }, value: data.token }
        }));
        window.location.href = '/api-docs/backoffice';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.textContent = 'Sign in';
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`);
});
// Swagger / OpenAPI
const openApiPath = path_1.default.join(__dirname, "..", "openapi.json");
let openApiSpec = {};
try {
    openApiSpec = JSON.parse(fs_1.default.readFileSync(openApiPath, "utf-8"));
}
catch (e) {
    console.warn("Swagger: openapi.json not found at", openApiPath, "- docs disabled");
}
// Helper: filter openapi spec paths by x-usedBy audience
function filterSpecByAudience(spec, audience) {
    const filtered = JSON.parse(JSON.stringify(spec));
    const paths = filtered.paths || {};
    const filteredPaths = {};
    for (const [pathKey, methods] of Object.entries(paths)) {
        const filteredMethods = {};
        for (const [method, operation] of Object.entries(methods)) {
            const usedBy = operation["x-usedBy"] || [];
            if (usedBy.includes(audience)) {
                filteredMethods[method] = operation;
            }
        }
        if (Object.keys(filteredMethods).length > 0) {
            filteredPaths[pathKey] = filteredMethods;
        }
    }
    filtered.paths = filteredPaths;
    return filtered;
}
// Full spec
app.get("/api-docs.json", (_req, res) => {
    res.json(openApiSpec);
});
// Filtered specs
app.get("/api-docs/backoffice.json", (_req, res) => {
    res.json(filterSpecByAudience(openApiSpec, "backoffice"));
});
app.get("/api-docs/frontend.json", (_req, res) => {
    res.json(filterSpecByAudience(openApiSpec, "frontend"));
});
// Swagger UI: full, backoffice, frontend (each on its own Router to avoid conflicts)
const swaggerUiOpts = {
    swaggerOptions: {
        docExpansion: "list",
        displayRequestDuration: true,
        persistAuthorization: true, // keeps the Bearer token across page refreshes
    },
};
const backofficeSpec = filterSpecByAudience(openApiSpec, "backoffice");
const frontendSpec = filterSpecByAudience(openApiSpec, "frontend");
// Backoffice-only Swagger UI
const backofficeRouter = express_1.default.Router();
backofficeRouter.use("/", swagger_ui_express_1.default.serveFiles(backofficeSpec, swaggerUiOpts));
backofficeRouter.get("/", swagger_ui_express_1.default.setup(backofficeSpec, swaggerUiOpts));
app.use("/api-docs/backoffice", backofficeRouter);
// Frontend-only Swagger UI
const frontendRouter = express_1.default.Router();
frontendRouter.use("/", swagger_ui_express_1.default.serveFiles(frontendSpec, swaggerUiOpts));
frontendRouter.get("/", swagger_ui_express_1.default.setup(frontendSpec, swaggerUiOpts));
app.use("/api-docs/frontend", frontendRouter);
// Full Swagger UI (all paths) — must be registered last
const fullRouter = express_1.default.Router();
fullRouter.use("/", swagger_ui_express_1.default.serveFiles(openApiSpec, swaggerUiOpts));
fullRouter.get("/", swagger_ui_express_1.default.setup(openApiSpec, swaggerUiOpts));
app.use("/api-docs", fullRouter);
// Routes
app.use("/api/auth", authLimiter, authRoutes_1.default);
// Public routes
app.use("/api/items", itemRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/sub-categories", subCategoryRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
app.use("/api/enums", enumRoutes_1.default);
app.use("/api/shipping", shippingRoutes_1.default);
app.use("/api/newsletter", newsletterRoutes_1.default);
app.use("/api/notify", notificationRoutes_1.default);
app.use("/api/discount-codes", discountCodeRoutes_1.default);
// Mixed public/auth routes (auth handled per-route inside the router)
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/creditcards", creditCardRoutes_1.default);
app.use("/api/wishlist", wishlistRoutes_1.default);
// Upload route (auth + admin checked inside the router)
app.use("/api/upload", uploadRoutes_1.default);
// Admin-only route groups (entire router gated)
const adminOnly = [auth_1.authenticate, (0, auth_1.requireRole)(userEnums_1.UserRole.ADMIN)];
app.use("/api/transactions", ...adminOnly, transactionRoutes_1.default);
app.use("/api/sales", ...adminOnly, saleRoutes_1.default);
app.use("/api/outfits", ...adminOnly, outfitRoutes_1.default);
app.use("/api/outfititems", ...adminOnly, outfitItemRoutes_1.default);
app.use("/api/demands", ...adminOnly, demandRoutes_1.default);
app.use("/api/drops", ...adminOnly, dropRoutes_1.default);
app.use("/api/sellers", ...adminOnly, sellerRoutes_1.default);
app.use("/api/orderitems", ...adminOnly, orderItemRoutes_1.default);
app.use("/api/incomes", ...adminOnly, incomeRoutes_1.default);
app.use("/api/expenses", ...adminOnly, expenseRoutes_1.default);
app.use("/api/employees", ...adminOnly, employeeRoutes_1.default);
app.use("/api/payouts", ...adminOnly, payoutRoutes_1.default);
const PORT = process.env.PORT || 3000;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.default)();
    yield (0, db_1.ensureCollections)();
    yield (0, db_1.syncIndexes)();
    // Centralised error handler (must be last)
    app.use(errorHandler_1.errorHandler);
    // Schedule daily email verification at 5 PM GMT+3 (Asia/Kuwait timezone)
    // Only verifies emails from the last 24 hours
    node_schedule_1.default.scheduleJob({ rule: "0 17 * * *", tz: "Asia/Kuwait" }, () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log("[Scheduler] Starting daily Verifalia batch verification at 5 PM GMT+3...");
            yield (0, verificationService_1.batchVerifyEmails)();
        }
        catch (error) {
            console.error("[Scheduler] Error during batch verification:", error);
        }
    }));
    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
        console.log(`📧 Email verification scheduled daily at 5 PM`);
    });
});
startServer();
