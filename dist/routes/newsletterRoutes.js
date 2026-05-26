"use strict";
// src/routes/newsletterRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const newsletterController_1 = __importDefault(require("../controllers/newsletterController"));
const auth_1 = require("../middleware/auth");
const userEnums_1 = require("../enums/userEnums");
const router = express_1.default.Router();
// POST /api/newsletter              → subscribe { email }  (public)
router.post("/", newsletterController_1.default.subscribe);
// DELETE /api/newsletter/:email     → unsubscribe by email (public)
router.delete("/:email", newsletterController_1.default.unsubscribe);
// GET /api/newsletter               → list subscribers    (admin only)
router.get("/", auth_1.authenticate, (0, auth_1.requireRole)(userEnums_1.UserRole.ADMIN), newsletterController_1.default.getSubscribers);
exports.default = router;
