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
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler";

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
import sellerController from "./controllers/sellerController";
import incomeRoutes from "./routes/incomeRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import payoutRoutes from "./routes/payoutRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import shippingRoutes from "./routes/shippingRoutes";
import newsletterRoutes from "./routes/newsletterRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import authRoutes from "./routes/authRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import { authenticate, requireRole } from "./middleware/auth";
import { UserRole } from "./enums/userEnums";
import schedule from "node-schedule";
import { batchVerifyEmails } from "./services/verificationService";

dotenv.config();

// Add unhandled error handlers
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
});

const app = express();

// Security headers
app.use(helmet());

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

app.use(cors(corsOptions));

// Global rate limit — 200 req / 15 min per IP
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 200,
	standardHeaders: true,
	legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
});

// JSON body parser - handle empty bodies gracefully
app.use(
	express.json({
		limit: "10mb",
		strict: false, // Allow non-object JSON (arrays, strings, etc.)
	}),
);
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Ensure preflight requests always get a CORS response
app.options(/.*/, cors(corsOptions));

// Ensure DB is connected on every request (idempotent — fast after first call)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
	try {
		await connectDB();
		next();
	} catch (err) {
		next(err);
	}
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

// Backoffice login page
app.get("/backoffice", (_req: Request, res: Response): void => {
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
const openApiPath = path.join(__dirname, "..", "openapi.json");
let openApiSpec: Record<string, any> = {};
try {
	openApiSpec = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));
} catch (e) {
	console.warn("Swagger: openapi.json not found at", openApiPath, "- docs disabled");
}

// Helper: filter openapi spec paths by x-usedBy audience
function filterSpecByAudience(spec: Record<string, any>, audience: string): Record<string, any> {
	const filtered = JSON.parse(JSON.stringify(spec));
	const paths = filtered.paths || {};
	const filteredPaths: Record<string, any> = {};
	for (const [pathKey, methods] of Object.entries(paths) as [string, any][]) {
		const filteredMethods: Record<string, any> = {};
		for (const [method, operation] of Object.entries(methods) as [string, any][]) {
			const usedBy: string[] = operation["x-usedBy"] || [];
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
app.get("/api-docs.json", (_req: Request, res: Response): void => {
	res.json(openApiSpec);
});

// Filtered specs
app.get("/api-docs/backoffice.json", (_req: Request, res: Response): void => {
	res.json(filterSpecByAudience(openApiSpec, "backoffice"));
});

app.get("/api-docs/frontend.json", (_req: Request, res: Response): void => {
	res.json(filterSpecByAudience(openApiSpec, "frontend"));
});

// Swagger UI: full, backoffice, frontend (each on its own Router to avoid conflicts)
const swaggerUiOpts = {
	swaggerOptions: {
		docExpansion: "list" as const,
		displayRequestDuration: true,
		persistAuthorization: true, // keeps the Bearer token across page refreshes
	},
};

const backofficeSpec = filterSpecByAudience(openApiSpec, "backoffice");
const frontendSpec = filterSpecByAudience(openApiSpec, "frontend");

// Backoffice-only Swagger UI
const backofficeRouter = express.Router();
backofficeRouter.use("/", swaggerUi.serveFiles(backofficeSpec, swaggerUiOpts));
backofficeRouter.get("/", swaggerUi.setup(backofficeSpec, swaggerUiOpts));
app.use("/api-docs/backoffice", backofficeRouter);

// Frontend-only Swagger UI
const frontendRouter = express.Router();
frontendRouter.use("/", swaggerUi.serveFiles(frontendSpec, swaggerUiOpts));
frontendRouter.get("/", swaggerUi.setup(frontendSpec, swaggerUiOpts));
app.use("/api-docs/frontend", frontendRouter);

// Full Swagger UI (all paths) — must be registered last
const fullRouter = express.Router();
fullRouter.use("/", swaggerUi.serveFiles(openApiSpec, swaggerUiOpts));
fullRouter.get("/", swaggerUi.setup(openApiSpec, swaggerUiOpts));
app.use("/api-docs", fullRouter);

// Routes
app.use("/api/auth", authLimiter, authRoutes);

// Public routes
app.use("/api/items", itemRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/sub-categories", subCategoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/enums", enumRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/notify", notificationRoutes);
app.use("/api/discount-codes", discountCodeRoutes);

// Mixed public/auth routes (auth handled per-route inside the router)
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/creditcards", creditCardRoutes);
app.use("/api/wishlist", wishlistRoutes);

// Upload route (auth + admin checked inside the router)
app.use("/api/upload", uploadRoutes);

// Public: Google Form seller registration (no auth)
app.post("/api/sellers/from-form", sellerController.registerFromForm as express.RequestHandler);

// Admin-only route groups (entire router gated)
const adminOnly = [authenticate, requireRole(UserRole.ADMIN)];
app.use("/api/transactions", ...adminOnly, transactionRoutes);
app.use("/api/sales", ...adminOnly, saleRoutes);
app.use("/api/outfits", ...adminOnly, outfitRoutes);
app.use("/api/outfititems", ...adminOnly, outfitItemRoutes);
app.use("/api/demands", ...adminOnly, demandRoutes);
app.use("/api/drops", ...adminOnly, dropRoutes);
app.use("/api/sellers", ...adminOnly, sellerRoutes);
app.use("/api/orderitems", ...adminOnly, orderItemRoutes);
app.use("/api/incomes", ...adminOnly, incomeRoutes);
app.use("/api/expenses", ...adminOnly, expenseRoutes);
app.use("/api/employees", ...adminOnly, employeeRoutes);
app.use("/api/payouts", ...adminOnly, payoutRoutes);

const PORT = process.env.PORT || 3000;

// Centralised error handler (must be last middleware)
app.use(errorHandler);

// Export app for Vercel serverless
export default app;

// In serverless (Vercel), DB connects per-request via the middleware above.
// Locally, connect once on startup, sync indexes, and run scheduled jobs.
if (!process.env.VERCEL) {
	(async () => {
		await connectDB();
		await ensureCollections();
		await syncIndexes();

		// Schedule daily email verification at 5 PM GMT+3 (Asia/Kuwait timezone)
		schedule.scheduleJob({ rule: "0 17 * * *", tz: "Asia/Kuwait" }, async () => {
			try {
				console.log("[Scheduler] Starting daily Verifalia batch verification at 5 PM GMT+3...");
				await batchVerifyEmails();
			} catch (error) {
				console.error("[Scheduler] Error during batch verification:", error);
			}
		});

		app.listen(PORT, () => {
			console.log(`Server running on http://localhost:${PORT}`);
			console.log(`API docs: http://localhost:${PORT}/api-docs`);
		});
	})();
}
