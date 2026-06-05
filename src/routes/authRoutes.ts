// src/routes/authRoutes.ts
import express, { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import authController from "../controllers/authController";
import { validate } from "../middleware/validation";
import { loginSchema, registerSchema } from "../validations/schemas";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// OTP limit — 5 requests per hour per IP
const otpLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 5,
	message: { success: false, error: "Too many OTP requests. Try again in an hour." },
	standardHeaders: true,
	legacyHeaders: false,
});

router.post("/register", validate(registerSchema), authController.register as RequestHandler);
router.post("/login", validate(loginSchema), authController.login as RequestHandler);
router.post("/refresh", authController.refresh as RequestHandler);
router.post("/logout", authController.logout as RequestHandler);
router.post("/forgot-password", otpLimiter, authController.forgotPassword as RequestHandler);
router.post("/reset-password", otpLimiter, authController.resetPassword as RequestHandler);
router.get("/me", authenticate, authController.me as RequestHandler);

export default router;
