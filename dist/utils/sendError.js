"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = sendError;
/**
 * Consistent JSON error shape for controllers (use with validation middleware
 * which already returns { success, error, code, details? } for Zod failures).
 */
function sendError(res, status, error, code) {
    const body = {
        success: false,
        error,
    };
    if (code !== undefined) {
        body.code = code;
    }
    res.status(status).json(body);
}
