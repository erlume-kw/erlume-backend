"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uploadController_1 = __importDefault(require("../controllers/uploadController"));
const auth_1 = require("../middleware/auth");
const userEnums_1 = require("../enums/userEnums");
const router = express_1.default.Router();
// Store file in memory — we stream it straight to Cloudinary, never touch disk
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit
});
// POST /api/upload — admin only
router.post("/", auth_1.authenticate, (0, auth_1.requireRole)(userEnums_1.UserRole.ADMIN), upload.single("file"), uploadController_1.default.uploadFile);
exports.default = router;
