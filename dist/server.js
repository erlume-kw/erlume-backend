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
const wishlistRoutes_1 = __importDefault(require("./routes/wishlistRoutes"));
const shippingRoutes_1 = __importDefault(require("./routes/shippingRoutes"));
const newsletterRoutes_1 = __importDefault(require("./routes/newsletterRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const auth_1 = require("./middleware/auth");
const userEnums_1 = require("./enums/userEnums");
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
app.use("/api/discount-codes", discountCodeRoutes_1.default);
// Mixed public/auth routes (auth handled per-route inside the router)
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/creditcards", creditCardRoutes_1.default);
app.use("/api/wishlist", wishlistRoutes_1.default);
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
const PORT = process.env.PORT || 3000;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.default)();
    yield (0, db_1.ensureCollections)();
    yield (0, db_1.syncIndexes)();
    // Centralised error handler (must be last)
    app.use(errorHandler_1.errorHandler);
    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
    });
});
startServer();
