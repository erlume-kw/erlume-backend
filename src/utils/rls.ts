// src/utils/rls.ts
import { Request, Response } from "express";
import { UserRole } from "../enums/userEnums";

export const isAdmin = (req: Request): boolean =>
	!!req.user?.roles.includes(UserRole.ADMIN);

/** Returns true if the requester is either an admin or the owner of the resource. */
export const isSelfOrAdmin = (req: Request, resourceUserId: string): boolean =>
	isAdmin(req) || req.user?._id === resourceUserId;

/** Sends 403 and returns false if the requester is not self or admin. */
export const assertSelfOrAdmin = (
	req: Request,
	res: Response,
	resourceUserId: string,
): boolean => {
	if (!isSelfOrAdmin(req, resourceUserId)) {
		res.status(403).json({ success: false, error: "Forbidden", code: "FORBIDDEN" });
		return false;
	}
	return true;
};
