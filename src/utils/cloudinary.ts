import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type UploadFolder =
	| "items"
	| "receipts"
	| "price-estimators"
	| "quotes";

/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure URL and public_id.
 */
export const uploadToCloudinary = (
	buffer: Buffer,
	folder: UploadFolder,
): Promise<{ url: string; publicId: string }> => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{
				folder: `erlume/${folder}`,
				resource_type: "auto",
				transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
			},
			(error, result) => {
				if (error || !result) return reject(error ?? new Error("Upload failed"));
				resolve({ url: result.secure_url, publicId: result.public_id });
			},
		);
		stream.end(buffer);
	});
};

/**
 * Delete a file from Cloudinary by its public_id.
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
	await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
