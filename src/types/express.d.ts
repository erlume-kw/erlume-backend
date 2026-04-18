// src/types/express.d.ts
// Augments Express's Request interface so req.user is typed throughout the entire project.
// This file is auto-included via tsconfig "include": ["src/**/*"] — no explicit import needed.

import { UserRole } from "../enums/userEnums";

declare global {
	namespace Express {
		interface Request {
			user?: {
				_id: string;     // ObjectId string extracted from JWT payload
				roles: UserRole[];
			};
		}
	}
}

export {};
