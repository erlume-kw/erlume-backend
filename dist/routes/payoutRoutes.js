"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payoutController_1 = __importDefault(require("../controllers/payoutController"));
const router = express_1.default.Router();
router.get("/", payoutController_1.default.getAll);
router.get("/:id", payoutController_1.default.getById);
router.post("/", payoutController_1.default.create);
router.patch("/:id", payoutController_1.default.update);
router.delete("/:id", payoutController_1.default.delete);
exports.default = router;
