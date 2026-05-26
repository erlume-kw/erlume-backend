"use strict";
// src/middleware/errorHandler.ts
// Single 4-argument Express error handler — must be registered LAST in server.ts.
// Handles all errors in one place with a consistent response shape:
//   { success: false, error: string, code?: string, details?: [...] }
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, 
// next is required as the 4th argument so Express recognises this as an error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
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
        const details = Object.values((_a = err.errors) !== null && _a !== void 0 ? _a : {}).map((e) => ({
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
        const field = (_c = Object.keys((_b = err.keyValue) !== null && _b !== void 0 ? _b : {})[0]) !== null && _c !== void 0 ? _c : "field";
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
            error: (_d = err.message) !== null && _d !== void 0 ? _d : (err.status === 401 ? "Unauthorized" : "Forbidden"),
            code: (_e = err.code) !== null && _e !== void 0 ? _e : (err.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN"),
        });
        return;
    }
    // ── Multer errors (file upload) ────────────────────────────────────────────
    // MulterError has a .code property like LIMIT_FILE_SIZE, LIMIT_UNEXPECTED_FILE
    if (err.name === "MulterError") {
        const codeMap = {
            LIMIT_FILE_SIZE: "File too large (max 5 MB per file)",
            LIMIT_FILE_COUNT: "Too many files (max 5)",
            LIMIT_UNEXPECTED_FILE: "Unexpected field name in upload",
        };
        res.status(400).json({
            success: false,
            error: (_f = codeMap[err.code]) !== null && _f !== void 0 ? _f : err.message,
            code: (_g = err.code) !== null && _g !== void 0 ? _g : "UPLOAD_ERROR",
        });
        return;
    }
    // ── CORS rejection ─────────────────────────────────────────────────────────
    if ((_h = err.message) === null || _h === void 0 ? void 0 : _h.startsWith("CORS:")) {
        res.status(403).json({
            success: false,
            error: err.message,
            code: "CORS_BLOCKED",
        });
        return;
    }
    // ── Generic fallback ───────────────────────────────────────────────────────
    console.error(`[ErrorHandler] ${req.method} ${req.path}:`, err);
    res.status((_k = (_j = err.status) !== null && _j !== void 0 ? _j : err.statusCode) !== null && _k !== void 0 ? _k : 500).json({
        success: false,
        error: (_l = err.message) !== null && _l !== void 0 ? _l : "Internal server error",
        code: (_m = err.code) !== null && _m !== void 0 ? _m : "INTERNAL_ERROR",
    });
}
