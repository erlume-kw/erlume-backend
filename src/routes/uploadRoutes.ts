import express, { RequestHandler } from "express";
import multer from "multer";
import uploadController from "../controllers/uploadController";
import { authenticate, requireRole } from "../middleware/auth";
import { UserRole } from "../enums/userEnums";

const router = express.Router();

// Store file in memory — we stream it straight to Cloudinary, never touch disk
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit
});

// POST /api/upload — admin only
router.post(
	"/",
	authenticate,
	requireRole(UserRole.ADMIN),
	upload.single("file"),
	uploadController.uploadFile as RequestHandler,
);

export default router;
