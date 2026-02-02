"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = __importDefault(require("../controllers/userController"));
const sellerController_1 = __importDefault(require("../controllers/sellerController"));
const router = express_1.default.Router();
/**
 * Seller routes - cleaner API for seller operations
 * These routes map to user controller functions but use seller ID (which is the user ID)
 */
// Get sellers
router.get("/", sellerController_1.default.getSellers);
router.get("/:id", sellerController_1.default.getSellerById);
router.post("/", sellerController_1.default.createSeller);
// Update seller info
router.put("/:id", userController_1.default.updateSellerInfo);
router.patch("/:id", userController_1.default.updateSellerInfo);
// Delete seller (soft-delete user + deactivate seller)
router.delete("/:id", sellerController_1.default.deleteSeller);
exports.default = router;
