import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

// Standard error response format
interface ValidationErrorResponse {
	success: false;
	error: string;
	code?: string;
	details?: Array<{ field: string; message: string }>;
}

// Validation middleware factory for request body
export const validate = (schema: ZodSchema) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			// Validate request body
			const validated = schema.parse(req.body);
			// Replace req.body with validated (and potentially transformed) data
			req.body = validated;
			next();
		} catch (error) {
			if (error instanceof ZodError) {
				// Log validation errors for debugging
				console.error("Validation error:", {
					path: req.path,
					method: req.method,
					body: req.body,
					errors: error.issues,
				});
				
				const response: ValidationErrorResponse = {
					success: false,
					error: "Validation error",
					code: "VALIDATION_ERROR",
					details: error.issues.map((err) => ({
						field: err.path.join("."),
						message: err.message,
					})),
				};
				res.status(400).json(response);
				return;
			}

			// Unexpected error
			console.error("Unexpected validation error:", error);
			res.status(500).json({
				success: false,
				error: "Internal server error",
				code: "INTERNAL_ERROR",
			});
		}
	};
};

// Validate params (for route parameters like :id)
export const validateParams = (schema: ZodSchema) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			const validated = schema.parse(req.params);
			req.params = validated as any;
			next();
		} catch (error) {
		if (error instanceof ZodError) {
			const response: ValidationErrorResponse = {
				success: false,
				error: "Invalid route parameters",
				code: "INVALID_PARAMS",
				details: error.issues.map((err) => ({
					field: err.path.join("."),
					message: err.message,
				})),
			};
			res.status(400).json(response);
			return;
		}
			res.status(500).json({
				success: false,
				error: "Internal server error",
				code: "INTERNAL_ERROR",
			});
		}
	};
};

// Validate query parameters
// This is lenient - allows empty queries and only validates when params are provided
export const validateQuery = (schema: ZodSchema) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			// If no query params, skip validation entirely
			if (!req.query || Object.keys(req.query).length === 0) {
				next();
				return;
			}

			// Use safeParse for query params - this won't throw
			const result = schema.safeParse(req.query);
			
			if (result.success) {
				// Update req.query with validated/transformed values if any
				const validatedData = result.data as Record<string, unknown>;
				if (validatedData && typeof validatedData === 'object') {
					// Merge validated data back into query
					Object.assign(req.query, validatedData);
				}
				next();
			} else if (result.error) {
				// Validation failed - return error with details
				const response: ValidationErrorResponse = {
					success: false,
					error: "Invalid query parameters",
					code: "INVALID_QUERY",
					details: result.error.issues.map((err) => ({
						field: err.path.join("."),
						message: err.message,
					})),
				};
				res.status(400).json(response);
				return;
			} else {
				// Should not happen, but be safe
				next();
			}
		} catch (error) {
			// Unexpected error - log it but allow request to proceed for GET requests
			console.error("Query validation unexpected error:", error);
			// For GET requests, be lenient and allow through
			next();
		}
	};
};
