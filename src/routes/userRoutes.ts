import express, { Router, RequestHandler } from "express";
const router: Router = express.Router();
import userController from "../controllers/userController";
import { validate, validateParams, validateQuery } from "../middleware/validation";
import {
	createUserSchema,
	updateUserSchema,
	updateUserRolesSchema,
	idParamSchema,
	userFilterQuerySchema,
} from "../validations/schemas";

// User routes
router.get("/", validateQuery(userFilterQuerySchema), userController.getUsers as RequestHandler);
router.get("/:id", validateParams(idParamSchema), userController.getUserById as RequestHandler);
router.post("/", validate(createUserSchema), userController.createUser as RequestHandler);

// Role management routes (must come before generic /:id routes)
router.put(
	"/:id/roles",
	validateParams(idParamSchema),
	validate(updateUserRolesSchema),
	userController.updateUserRoles as RequestHandler,
);

// Generic user routes (must come after specific routes)
router.put(
	"/:id",
	validateParams(idParamSchema),
	validate(updateUserSchema),
	userController.updateUser as RequestHandler,
);
router.patch(
	"/:id",
	validateParams(idParamSchema),
	validate(updateUserSchema),
	userController.updateUser as RequestHandler,
);
router.delete("/:id", validateParams(idParamSchema), userController.deleteUser as RequestHandler);

export default router;
