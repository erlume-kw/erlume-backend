"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
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
const outfitRoutes_1 = __importDefault(require("./routes/outfitRoutes"));
const outfitItemRoutes_1 = __importDefault(require("./routes/outfitItemRoutes"));
const demandRoutes_1 = __importDefault(require("./routes/demandRoutes"));
const discountCodeRoutes_1 = __importDefault(require("./routes/discountCodeRoutes"));
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    next();
});
// CORS configuration
const corsOptions = {
    origin: true, // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Base route
app.get("/", (req, res) => {
    res.send("API is working");
});
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
app.use("/api/outfits", outfitRoutes_1.default);
app.use("/api/outfititems", outfitItemRoutes_1.default);
app.use("/api/demands", demandRoutes_1.default);
app.use("/api/discountcodes", discountCodeRoutes_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
