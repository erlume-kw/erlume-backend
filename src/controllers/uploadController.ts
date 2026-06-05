import { Request, Response } from "express";
import { uploadToCloudinary, type UploadFolder } from "../utils/cloudinary";

const VALID_FOLDERS: UploadFolder[] = ["items", "receipts", "price-estimators", "quotes", "drops", "outfits"];

const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/heic",   // iPhone photos
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
const uploadFile = async (req: Request, res: Response): Promise<void> => {
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

		const folder = VALID_FOLDERS.includes(req.body.folder as UploadFolder)
			? (req.body.folder as UploadFolder)
			: "items";

		const { url, publicId } = await uploadToCloudinary(buffer, folder);

		res.status(201).json({ success: true, url, publicId });
	} catch (error) {
		console.error("Error in uploadFile:", error);
		res.status(500).json({ success: false, error: "Upload failed" });
	}
};

export default { uploadFile };
