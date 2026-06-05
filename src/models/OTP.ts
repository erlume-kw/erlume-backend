import mongoose, { Schema } from "mongoose";

const OTPSchema = new Schema(
	{
		phoneNumber: { type: String, required: true, index: true },
		otp: { type: String, required: true },
		expiresAt: { type: Date, required: true },
		used: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

// Auto-delete expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", OTPSchema);

export default OTP;
