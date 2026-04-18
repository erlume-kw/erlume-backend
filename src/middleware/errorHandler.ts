// src/middleware/errorHandler.ts
// Single 4-argument Express error handler — must be registered LAST in server.ts.
// Handles all errors in one place with a consistent response shape:
//   { success: false, error: string, code?: string, details?: [...] }

import { Request, Response, NextFunction } from "express";

export function errorHandler(
	err: any,
	req: Request,
	res: Response,
	// next is required as the 4th argument so Express recognises this as an error handler
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_next: NextFunction,
): void {
	// ── JSON parse errors (body-parser / Express 5 built-in) ──────────────────
	if (err instanceof SyntaxError && "body" in err) {
		res.status(400).json({
			success: false,
			error: "Invalid JSON in request body",
			code: "INVALID_JSON",
		});
		return;
	}

	// ── Mongoose ValidationError ───────────────────────────────────────────────
	if (err.name === "ValidationError") {
		const details = Object.values(err.errors ?? {}).map((e: any) => ({
			field: e.path,
			message: e.message,
		}));
		res.status(400).json({
			success: false,
			error: "Validation failed",
			code: "VALIDATION_ERROR",
			details,
		});
		return;
	}

	// ── Mongoose CastError (invalid ObjectId in a query) ──────────────────────
	if (err.name === "CastError") {
		res.status(400).json({
			success: false,
			error: "Invalid ID format",
			code: "INVALID_ID",
		});
		return;
	}

	// ── Mongoose duplicate key (unique index violation) ────────────────────────
	if (err.code === 11000) {
		const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
		res.status(409).json({
			success: false,
			error: `Duplicate value for ${field}`,
			code: "DUPLICATE_KEY",
		});
		return;
	}

	// ── JWT errors (handled here; jsonwebtoken not yet installed so use name checks) ──
	// TokenExpiredError and JsonWebTokenError both have err.name set by jsonwebtoken.
	if (err.name === "TokenExpiredError") {
		res.status(401).json({
			success: false,
			error: "Token expired — please log in again",
			code: "TOKEN_EXPIRED",
		});
		return;
	}
	if (err.name === "JsonWebTokenError") {
		res.status(401).json({
			success: false,
			error: "Invalid token",
			code: "INVALID_TOKEN",
		});
		return;
	}

	// ── Auth / RLS errors attached by middleware (status 401 / 403) ───────────
	if (err.status === 401 || err.status === 403) {
		res.status(err.status).json({
			success: false,
			error: err.message ?? (err.status === 401 ? "Unauthorized" : "Forbidden"),
			code: err.code ?? (err.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN"),
		});
		return;
	}

	// ── Multer errors (file upload) ────────────────────────────────────────────
	// MulterError has a .code property like LIMIT_FILE_SIZE, LIMIT_UNEXPECTED_FILE
	if (err.name === "MulterError") {
		const codeMap: Record<string, string> = {
			LIMIT_FILE_SIZE: "File too large (max 5 MB per file)",
			LIMIT_FILE_COUNT: "Too many files (max 5)",
			LIMIT_UNEXPECTED_FILE: "Unexpected field name in upload",
		};
		res.status(400).json({
			success: false,
			error: codeMap[err.code] ?? err.message,
			code: err.code ?? "UPLOAD_ERROR",
		});
		return;
	}

	// ── CORS rejection ─────────────────────────────────────────────────────────
	if (err.message?.startsWith("CORS:")) {
		res.status(403).json({
			success: false,
			error: err.message,
			code: "CORS_BLOCKED",
		});
		return;
	}

	// ── Generic fallback ───────────────────────────────────────────────────────
	console.error(`[ErrorHandler] ${req.method} ${req.path}:`, err);
	res.status(err.status ?? err.statusCode ?? 500).json({
		success: false,
		error: err.message ?? "Internal server error",
		code: err.code ?? "INTERNAL_ERROR",
	});
}
