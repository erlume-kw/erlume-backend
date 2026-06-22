"use strict";
// src/routes/notificationRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = __importDefault(require("../controllers/notificationController"));
const router = express_1.default.Router();
// POST /api/notify              → subscribe { email, itemId, itemName, brandName } (public)
router.post("/", notificationController_1.default.subscribe);
// DELETE /api/notify/:email/:itemId → unsubscribe from item (public)
router.delete("/:email/:itemId", notificationController_1.default.unsubscribe);
exports.default = router;
