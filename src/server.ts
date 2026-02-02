// src/server.ts
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import connectDB, {
	ensureCollections,
	syncIndexes,
} from "./config/db";
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
import saleRoutes from "./routes/saleRoutes";
import outfitRoutes from "./routes/outfitRoutes";
import outfitItemRoutes from "./routes/outfitItemRoutes";
import demandRoutes from "./routes/demandRoutes";
import discountCodeRoutes from "./routes/discountCodeRoutes";
import dropRoutes from "./routes/dropRoutes";
import enumRoutes from "./routes/enumRoutes";
import sellerRoutes from "./routes/sellerRoutes";
import incomeRoutes from "./routes/incomeRoutes";
import expenseRoutes from "./routes/expenseRoutes";

dotenv.config();

// Add unhandled error handlers
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
});

const app = express();

// CORS configuration
const corsOptions = {
	origin: true, // Allow all origins
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	credentials: true,
	optionsSuccessStatus: 204,
	allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// JSON body parser - handle empty bodies gracefully
app.use(
	express.json({
		limit: "10mb",
		strict: false, // Allow non-object JSON (arrays, strings, etc.)
	}),
);
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Custom middleware to handle empty JSON bodies gracefully
app.use((req: Request, res: Response, next: NextFunction) => {
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
	app.use((req: Request, res: Response, next: NextFunction) => {
		console.log(`${req.method} ${req.path}`);
		console.log("Headers:", req.headers);
		console.log("Body:", req.body);
		next();
	});
}

// Base route
app.get("/", (req: Request, res: Response) => {
	res.send("API is working");
});

// Swagger / OpenAPI docs: full spec + backoffice-only and frontend-only (filtered by x-usedBy)
const openApiPath = path.join(__dirname, "..", "openapi.json");
let openApiSpec: Record<string, unknown> = {};
try {
	openApiSpec = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));
} catch (e) {
	console.warn("Swagger: openapi.json not found at", openApiPath, "- docs disabled");
}

function filterSpecByAudience(
	spec: Record<string, unknown>,
	audience: "backoffice" | "frontend",
): Record<string, unknown> {
	const paths = spec.paths as Record<string, unknown> | undefined;
	if (!paths) return { ...spec, paths: {} };
	const filteredPaths: Record<string, unknown> = {};
	for (const [pathKey, pathItem] of Object.entries(paths)) {
		const item = pathItem as Record<string, unknown>;
		const usedByList: unknown = item?.["x-usedBy"];
		if (Array.isArray(usedByList) && usedByList.includes(audience)) {
			filteredPaths[pathKey] = pathItem;
		}
	}
	const specInfo = spec.info as Record<string, unknown> | undefined;
	const infoTitle = (specInfo?.title as string) ?? "API";
	const infoDesc = (specInfo?.description as string) ?? "";
	const pathCount = Object.keys(filteredPaths).length;
	return {
		...spec,
		info: {
			...specInfo,
			title: `${infoTitle} — ${audience} only`,
			description: `**Filtered view:** Only paths where \`x-usedBy\` includes "${audience}" (${pathCount} path(s)). Shared endpoints appear in both backoffice and frontend docs. ${infoDesc}`,
		},
		paths: filteredPaths,
	};
}

const backofficeSpec = filterSpecByAudience(openApiSpec, "backoffice");
const frontendSpec = filterSpecByAudience(openApiSpec, "frontend");

// Serve spec JSON first (so Swagger UI can fetch by URL and avoid resolver errors)
app.get("/api-docs.json", (_req: Request, res: Response): void => {
	res.json(openApiSpec);
});
app.get("/api-docs/backoffice.json", (_req: Request, res: Response): void => {
	res.json(backofficeSpec);
});
app.get("/api-docs/frontend.json", (_req: Request, res: Response): void => {
	res.json(frontendSpec);
});

// Swagger UI: inline spec (deep copy) so operations render; docExpansion "full" so they show by default
const swaggerUiOpts = { swaggerOptions: { docExpansion: "full" as const, displayRequestDuration: true } };
app.use("/api-docs/backoffice", swaggerUi.serve, swaggerUi.setup(JSON.parse(JSON.stringify(backofficeSpec)), swaggerUiOpts));
app.use("/api-docs/frontend", swaggerUi.serve, swaggerUi.setup(JSON.parse(JSON.stringify(frontendSpec)), swaggerUiOpts));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(JSON.parse(JSON.stringify(openApiSpec)), swaggerUiOpts));

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
app.use("/api/sales", saleRoutes);
app.use("/api/outfits", outfitRoutes);
app.use("/api/outfititems", outfitItemRoutes);
app.use("/api/demands", demandRoutes);
app.use("/api/discountcodes", discountCodeRoutes);
app.use("/api/drops", dropRoutes);
app.use("/api/enums", enumRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/incomes", incomeRoutes);
app.use("/api/expenses", expenseRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
	await connectDB();
	await ensureCollections();
	await syncIndexes();

	// Error handling middleware for JSON parsing errors (must be after all routes)
	app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
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
};

startServer();
