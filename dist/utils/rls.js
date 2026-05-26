"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertSelfOrAdmin = exports.isSelfOrAdmin = exports.isAdmin = void 0;
const userEnums_1 = require("../enums/userEnums");
const isAdmin = (req) => { var _a; return !!((_a = req.user) === null || _a === void 0 ? void 0 : _a.roles.includes(userEnums_1.UserRole.ADMIN)); };
exports.isAdmin = isAdmin;
/** Returns true if the requester is either an admin or the owner of the resource. */
const isSelfOrAdmin = (req, resourceUserId) => { var _a; return (0, exports.isAdmin)(req) || ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === resourceUserId; };
exports.isSelfOrAdmin = isSelfOrAdmin;
/** Sends 403 and returns false if the requester is not self or admin. */
const assertSelfOrAdmin = (req, res, resourceUserId) => {
    if (!(0, exports.isSelfOrAdmin)(req, resourceUserId)) {
        res.status(403).json({ success: false, error: "Forbidden", code: "FORBIDDEN" });
        return false;
    }
    return true;
};
exports.assertSelfOrAdmin = assertSelfOrAdmin;
