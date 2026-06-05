import mongoose, { Schema } from "mongoose";

const RefreshTokenSchema = new Schema(
	{
		token: { type: String, required: true, unique: true, index: true },
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
		expiresAt: { type: Date, required: true },
		isRevoked: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

// Auto-delete expired tokens from DB
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
