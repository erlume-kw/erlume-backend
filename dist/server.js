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
dotenv_1.default.config();
// Add unhandled error handlers
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});
const app = (0, express_1.default)();
// CORS configuration
const corsOptions = {
    origin: true, // Allow all origins
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use((0, cors_1.default)(corsOptions));
// JSON body parser - handle empty bodies gracefully
app.use(express_1.default.json({
    limit: "10mb",
    strict: false, // Allow non-object JSON (arrays, strings, etc.)
}));
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
// Custom middleware to handle empty JSON bodies gracefully
app.use((req, res, next) => {
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
        if (!req.body || Object.keys(req.body).length === 0) {
            // Empty body is OK, continue
        }
    }
    next();
});
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
// Swagger / OpenAPI docs: full spec + backoffice-only and frontend-only (filtered by x-usedBy)
const openApiPath = path_1.default.join(__dirname, "..", "openapi.json");
let openApiSpec = {};
try {
    openApiSpec = JSON.parse(fs_1.default.readFileSync(openApiPath, "utf-8"));
}
catch (e) {
    console.warn("Swagger: openapi.json not found at", openApiPath, "- docs disabled");
}
function filterSpecByAudience(spec, audience) {
    var _a, _b;
    const paths = spec.paths;
    if (!paths)
        return Object.assign(Object.assign({}, spec), { paths: {} });
    const filteredPaths = {};
    for (const [pathKey, pathItem] of Object.entries(paths)) {
        const item = pathItem;
        const usedByList = item === null || item === void 0 ? void 0 : item["x-usedBy"];
        if (Array.isArray(usedByList) && usedByList.includes(audience)) {
            filteredPaths[pathKey] = pathItem;
        }
    }
    const specInfo = spec.info;
    const infoTitle = (_a = specInfo === null || specInfo === void 0 ? void 0 : specInfo.title) !== null && _a !== void 0 ? _a : "API";
    const infoDesc = (_b = specInfo === null || specInfo === void 0 ? void 0 : specInfo.description) !== null && _b !== void 0 ? _b : "";
    const pathCount = Object.keys(filteredPaths).length;
    return Object.assign(Object.assign({}, spec), { info: Object.assign(Object.assign({}, specInfo), { title: `${infoTitle} — ${audience} only`, description: `**Filtered view:** Only paths where \`x-usedBy\` includes "${audience}" (${pathCount} path(s)). Shared endpoints appear in both backoffice and frontend docs. ${infoDesc}` }), paths: filteredPaths });
}
const backofficeSpec = filterSpecByAudience(openApiSpec, "backoffice");
const frontendSpec = filterSpecByAudience(openApiSpec, "frontend");
// Serve spec JSON first (so Swagger UI can fetch by URL and avoid resolver errors)
app.get("/api-docs.json", (_req, res) => {
    res.json(openApiSpec);
});
app.get("/api-docs/backoffice.json", (_req, res) => {
    res.json(backofficeSpec);
});
app.get("/api-docs/frontend.json", (_req, res) => {
    res.json(frontendSpec);
});
// Swagger UI: inline spec (deep copy) so operations render; docExpansion "full" so they show by default
const swaggerUiOpts = { swaggerOptions: { docExpansion: "full", displayRequestDuration: true } };
app.use("/api-docs/backoffice", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(JSON.parse(JSON.stringify(backofficeSpec)), swaggerUiOpts));
app.use("/api-docs/frontend", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(JSON.parse(JSON.stringify(frontendSpec)), swaggerUiOpts));
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(JSON.parse(JSON.stringify(openApiSpec)), swaggerUiOpts));
// Routes
app.use("/api/users", userRoutes_1.default);
app.use("/api/items", itemRoutes_1.default);
app.use("/api/categories", categoryRoutes_1.default);
app.use("/api/subcategories", subCategoryRoutes_1.default);
app.use("/api/reviews", reviewRoutes_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/orderitems", orderItemRoutes_1.default);
app.use("/api/creditcards", creditCardRoutes_1.default);
app.use("/api/transactions", transactionRoutes_1.default);
app.use("/api/sales", saleRoutes_1.default);
app.use("/api/outfits", outfitRoutes_1.default);
app.use("/api/outfititems", outfitItemRoutes_1.default);
app.use("/api/demands", demandRoutes_1.default);
app.use("/api/discountcodes", discountCodeRoutes_1.default);
app.use("/api/drops", dropRoutes_1.default);
app.use("/api/enums", enumRoutes_1.default);
app.use("/api/sellers", sellerRoutes_1.default);
app.use("/api/incomes", incomeRoutes_1.default);
app.use("/api/expenses", expenseRoutes_1.default);
app.use("/api/employees", employeeRoutes_1.default);
const PORT = process.env.PORT || 3000;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.default)();
    yield (0, db_1.ensureCollections)();
    yield (0, db_1.syncIndexes)();
    // Error handling middleware for JSON parsing errors (must be after all routes)
    app.use((err, req, res, next) => {
        if (err instanceof SyntaxError && "body" in err) {
            res.status(400).json({
                success: false,
                error: "Invalid JSON in request body",
                message: err.message,
            });
            return;
        }
        // Pass other errors to default Express error handler
        res.status(err.status || 500).json({
            success: false,
            error: err.message || "Internal server error",
        });
    });
    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 API docs: full http://localhost:${PORT}/api-docs | backoffice http://localhost:${PORT}/api-docs/backoffice | frontend http://localhost:${PORT}/api-docs/frontend`);
    });
});
startServer();
