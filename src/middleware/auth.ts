// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../enums/userEnums";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function authenticate(req: Request, res: Response, next: NextFunction): void {
	const header = req.headers.authorization;
	if (!header?.startsWith("Bearer ")) {
		res.status(401).json({ success: false, error: "No token provided", code: "UNAUTHORIZED" });
		return;
	}
	const token = header.slice(7);
	try {
		const payload = jwt.verify(token, JWT_SECRET) as { _id: string; roles: UserRole[] };
		req.user = { _id: payload._id, roles: payload.roles };
		next();
	} catch (err) {
		next(err); // TokenExpiredError / JsonWebTokenError → errorHandler
	}
}

export function requireRole(...roles: UserRole[]) {
	return (req: Request, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" });
			return;
		}
		const hasRole = roles.some((r) => req.user!.roles.includes(r));
		if (!hasRole) {
			res.status(403).json({ success: false, error: "Forbidden", code: "FORBIDDEN" });
			return;
		}
		next();
	};
}
