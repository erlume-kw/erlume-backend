import { v2 as cloudinary } from "cloudinary";

// ── Step 1: Configure Cloudinary ─────────────────────────────────────────────
cloudinary.config({
	cloud_name: "duffnn4da",
	api_key: "666237375285773",
	api_secret: "prisEbWd3Pm-EidEbYxHH5J0B_U",
});

async function main() {
	// ── Step 2: Upload a sample image ────────────────────────────────────────
	console.log("Uploading image...");
	const upload = await cloudinary.uploader.upload(
		"https://res.cloudinary.com/demo/image/upload/sample.jpg",
		{ public_id: "erlume_test_sample" },
	);

	console.log("Secure URL :", upload.secure_url);
	console.log("Public ID  :", upload.public_id);

	// ── Step 3: Get image details ─────────────────────────────────────────────
	console.log("\nFetching image details...");
	const details = await cloudinary.api.resource(upload.public_id);

	console.log("Width      :", details.width, "px");
	console.log("Height     :", details.height, "px");
	console.log("Format     :", details.format);
	console.log("File size  :", details.bytes, "bytes");

	// ── Step 4: Transform the image ───────────────────────────────────────────
	const transformedUrl = cloudinary.url(upload.public_id, {
		transformation: [
			{ fetch_format: "auto" }, // f_auto: serves WebP/AVIF based on browser support
			{ quality: "auto" },      // q_auto: reduces file size without visible quality loss
		],
		secure: true,
	});

	console.log("\nDone! Click link below to see optimized version of the image. Check the size and the format.");
	console.log("Transformed URL:", transformedUrl);
}

main().catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
