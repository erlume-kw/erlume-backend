"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/wishlistRoutes.ts
const express_1 = __importDefault(require("express"));
const wishlistController_1 = __importDefault(require("../controllers/wishlistController"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All wishlist routes require a logged-in user
router.get("/:userId", auth_1.authenticate, wishlistController_1.default.getWishlist);
router.post("/:userId/items", auth_1.authenticate, wishlistController_1.default.addToWishlist);
router.delete("/:userId/items/:itemId", auth_1.authenticate, wishlistController_1.default.removeFromWishlist);
router.delete("/:userId", auth_1.authenticate, wishlistController_1.default.clearWishlist);
exports.default = router;
