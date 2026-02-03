// src/server.ts
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import cors from "cors";

// Import routes
import userRoutes from "./routes/userRoutes";
import itemRoutes from "./routes/itemRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import subCategoryRoutes from "./routes/subCategoryRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import orderRoutes from "./routes/orderRoutes";
import orderItemRoutes from "./routes/orderItemRoutes";
import creditCardRoutes from "./routes/creditCardRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import outfitRoutes from "./routes/outfitRoutes";
import outfitItemRoutes from "./routes/outfitItemRoutes";
import demandRoutes from "./routes/demandRoutes";
import discountCodeRoutes from "./routes/discountCodeRoutes";

dotenv.config();
connectDB();

const app = express();

// Debug middleware
app.use((req: Request, res: Response, next: NextFunction) => {
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

app.use(cors(corsOptions));
// Ensure preflight requests always get a CORS response
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// Base route
app.get("/", (req: Request, res: Response) => {
	res.send("API is working");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/orderitems", orderItemRoutes);
app.use("/api/creditcards", creditCardRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/outfits", outfitRoutes);
app.use("/api/outfititems", outfitItemRoutes);
app.use("/api/demands", demandRoutes);
app.use("/api/discountcodes", discountCodeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`🚀 Server running on http://localhost:${PORT}`);
});
