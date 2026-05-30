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
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
/**
 * Upload a file buffer to Cloudinary.
 * Returns the secure URL and public_id.
 */
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder: `erlume/${folder}`,
            resource_type: "auto",
            transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
        }, (error, result) => {
            if (error || !result)
                return reject(error !== null && error !== void 0 ? error : new Error("Upload failed"));
            resolve({ url: result.secure_url, publicId: result.public_id });
        });
        stream.end(buffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Delete a file from Cloudinary by its public_id.
 */
const deleteFromCloudinary = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    yield cloudinary_1.v2.uploader.destroy(publicId);
});
exports.deleteFromCloudinary = deleteFromCloudinary;
exports.default = cloudinary_1.v2;
