"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authRoutes.ts
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = __importDefault(require("../controllers/authController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// OTP limit — 5 requests per hour per IP
const otpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { success: false, error: "Too many OTP requests. Try again in an hour." },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post("/register", (0, validation_1.validate)(schemas_1.registerSchema), authController_1.default.register);
router.post("/login", (0, validation_1.validate)(schemas_1.loginSchema), authController_1.default.login);
router.post("/refresh", authController_1.default.refresh);
router.post("/logout", authController_1.default.logout);
router.post("/forgot-password", otpLimiter, authController_1.default.forgotPassword);
router.post("/reset-password", otpLimiter, authController_1.default.resetPassword);
router.get("/me", auth_1.authenticate, authController_1.default.me);
exports.default = router;
