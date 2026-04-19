import express, { Router, RequestHandler } from "express";
const router: Router = express.Router();
import userController from "../controllers/userController";
import { validate, validateParams, validateQuery } from "../middleware/validation";
import { createUserSchema, updateUserSchema, updateUserRolesSchema, idParamSchema, userFilterQuerySchema } from "../validations/schemas";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../enums/userEnums";

const adminOnly = [authenticate, requireRole(UserRole.ADMIN)];

// Admin only
router.get("/", ...adminOnly, validateQuery(userFilterQuerySchema), userController.getUsers as RequestHandler);
router.post("/", ...adminOnly, validate(createUserSchema), userController.createUser as RequestHandler);
router.put("/:id/roles", ...adminOnly, validateParams(idParamSchema), validate(updateUserRolesSchema), userController.updateUserRoles as RequestHandler);
router.delete("/:id", ...adminOnly, validateParams(idParamSchema), userController.deleteUser as RequestHandler);

// Authenticated users (own profile)
router.get("/:id", authenticate, validateParams(idParamSchema), userController.getUserById as RequestHandler);
router.put("/:id", authenticate, validateParams(idParamSchema), validate(updateUserSchema), userController.updateUser as RequestHandler);
router.patch("/:id", authenticate, validateParams(idParamSchema), validate(updateUserSchema), userController.updateUser as RequestHandler);

export default router;
