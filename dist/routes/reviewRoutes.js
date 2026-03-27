"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const router = express_1.default.Router();
const reviewController_1 = __importDefault(require("../controllers/reviewController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", reviewController_1.default.getReviews);
router.get("/product/:productId", (0, validation_1.validateParams)(zod_1.z.object({ productId: zod_1.z.string() })), reviewController_1.default.getReviewsByProductId);
router.get("/seller/:sellerId", (0, validation_1.validateParams)(schemas_1.sellerIdParamSchema), reviewController_1.default.getReviewsBySellerId);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), reviewController_1.default.getReviewById);
router.post("/", (0, validation_1.validate)(schemas_1.createReviewSchema), reviewController_1.default.createReview);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateReviewSchema), reviewController_1.default.updateReview);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), reviewController_1.default.deleteReview);
exports.default = router;
