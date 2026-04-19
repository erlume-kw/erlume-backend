// src/routes/authRoutes.ts
import express, { RequestHandler } from "express";
import authController from "../controllers/authController";
import { validate } from "../middleware/validation";
import { loginSchema, registerSchema } from "../validations/schemas";
import { authenticate } from "../middleware/auth";

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register as RequestHandler);
router.post("/login", validate(loginSchema), authController.login as RequestHandler);
router.get("/me", authenticate, authController.me as RequestHandler);

export default router;
