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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const userEnums_1 = require("../enums/userEnums");
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
function signToken(userId, roles) {
    return jsonwebtoken_1.default.sign({ _id: userId, roles }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
const authController = {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { password, emailAddress, phoneNumber, address, roles } = req.body;
            const existing = yield User_1.default.findOne({ emailAddress, isDeleted: false });
            if (existing) {
                res.status(409).json({ success: false, error: "Email already in use", code: "DUPLICATE_KEY" });
                return;
            }
            const hashed = yield bcryptjs_1.default.hash(password, 12);
            const user = yield User_1.default.create({
                password: hashed,
                emailAddress,
                phoneNumber,
                address,
                roles: roles !== null && roles !== void 0 ? roles : [userEnums_1.UserRole.USER],
            });
            const token = signToken(String(user._id), user.roles);
            res.status(201).json({ success: true, token, user: { _id: user._id, emailAddress: user.emailAddress, roles: user.roles } });
        });
    },
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { emailAddress, password } = req.body;
            const user = yield User_1.default.findOne({ emailAddress, isDeleted: false }).select("+password");
            if (!user) {
                res.status(401).json({ success: false, error: "Invalid credentials", code: "UNAUTHORIZED" });
                return;
            }
            const valid = yield bcryptjs_1.default.compare(password, user.password);
            if (!valid) {
                res.status(401).json({ success: false, error: "Invalid credentials", code: "UNAUTHORIZED" });
                return;
            }
            const token = signToken(String(user._id), user.roles);
            res.json({ success: true, token, user: { _id: user._id, emailAddress: user.emailAddress, roles: user.roles } });
        });
    },
    me(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findById(req.user._id).select("-password");
            if (!user) {
                res.status(404).json({ success: false, error: "User not found" });
                return;
            }
            res.json({ success: true, user });
        });
    },
};
exports.default = authController;
