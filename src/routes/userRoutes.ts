import express, { Router, RequestHandler } from "express";
const router: Router = express.Router();
import userController from "../controllers/userController";

// User routes
router.get("/", userController.getUsers as RequestHandler);
router.get("/:id", userController.getUserById as RequestHandler);
router.post("/", userController.createUser as RequestHandler);

// Role management routes (must come before generic /:id routes)
router.put("/:id/roles", userController.updateUserRoles as RequestHandler);

// Generic user routes (must come after specific routes)
router.put("/:id", userController.updateUser as RequestHandler);
router.delete("/:id", userController.deleteUser as RequestHandler);

export default router;
