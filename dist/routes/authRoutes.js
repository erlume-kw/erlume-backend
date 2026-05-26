"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authRoutes.ts
const express_1 = __importDefault(require("express"));
const authController_1 = __importDefault(require("../controllers/authController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post("/register", (0, validation_1.validate)(schemas_1.registerSchema), authController_1.default.register);
router.post("/login", (0, validation_1.validate)(schemas_1.loginSchema), authController_1.default.login);
router.get("/me", auth_1.authenticate, authController_1.default.me);
exports.default = router;
