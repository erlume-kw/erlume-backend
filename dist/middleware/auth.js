"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!(header === null || header === void 0 ? void 0 : header.startsWith("Bearer "))) {
        res.status(401).json({ success: false, error: "No token provided", code: "UNAUTHORIZED" });
        return;
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = { _id: payload._id, roles: payload.roles };
        next();
    }
    catch (err) {
        next(err); // TokenExpiredError / JsonWebTokenError → errorHandler
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" });
            return;
        }
        const hasRole = roles.some((r) => req.user.roles.includes(r));
        if (!hasRole) {
            res.status(403).json({ success: false, error: "Forbidden", code: "FORBIDDEN" });
            return;
        }
        next();
    };
}
