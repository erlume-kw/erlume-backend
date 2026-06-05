"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("../utils/cloudinary");
const VALID_FOLDERS = ["items", "receipts", "price-estimators", "quotes", "drops", "outfits"];
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic", // iPhone photos
    "image/heif",
    "application/pdf",
];
const MAX_SIZE_MB = 10;
/**
 * POST /api/upload
 * Body: multipart/form-data
 *   - file   : the file to upload (required)
 *   - folder : "items" | "receipts" | "price-estimators" | "quotes" (default: "items")
 *
 * Returns: { success: true, url, publicId }
 */
const uploadFile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: "No file provided" });
            return;
        }
        const { mimetype, size, buffer } = req.file;
        if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
            res.status(400).json({
                success: false,
                error: `Unsupported file type: ${mimetype}. Allowed: JPEG, PNG, WebP, GIF, HEIC, PDF`,
            });
            return;
        }
        if (size > MAX_SIZE_MB * 1024 * 1024) {
            res.status(400).json({
                success: false,
                error: `File too large. Maximum size is ${MAX_SIZE_MB}MB`,
            });
            return;
        }
        const folder = VALID_FOLDERS.includes(req.body.folder)
            ? req.body.folder
            : "items";
        const { url, publicId } = yield (0, cloudinary_1.uploadToCloudinary)(buffer, folder);
        res.status(201).json({ success: true, url, publicId });
    }
    catch (error) {
        console.error("Error in uploadFile:", error);
        res.status(500).json({ success: false, error: "Upload failed" });
    }
});
exports.default = { uploadFile };
