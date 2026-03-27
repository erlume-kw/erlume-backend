import { Response } from "express";

/**
 * Consistent JSON error shape for controllers (use with validation middleware
 * which already returns { success, error, code, details? } for Zod failures).
 */
export function sendError(
	res: Response,
	status: number,
	error: string,
	code?: string,
): void {
	const body: { success: false; error: string; code?: string } = {
		success: false,
		error,
	};
	if (code !== undefined) {
		body.code = code;
	}
	res.status(status).json(body);
}
