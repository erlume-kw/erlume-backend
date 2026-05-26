"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const userController_1 = __importDefault(require("../controllers/userController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
const auth_1 = require("../middleware/auth");
const userEnums_1 = require("../enums/userEnums");
const adminOnly = [auth_1.authenticate, (0, auth_1.requireRole)(userEnums_1.UserRole.ADMIN)];
// Admin only
router.get("/", ...adminOnly, (0, validation_1.validateQuery)(schemas_1.userFilterQuerySchema), userController_1.default.getUsers);
router.post("/", ...adminOnly, (0, validation_1.validate)(schemas_1.createUserSchema), userController_1.default.createUser);
router.put("/:id/roles", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateUserRolesSchema), userController_1.default.updateUserRoles);
router.delete("/:id", ...adminOnly, (0, validation_1.validateParams)(schemas_1.idParamSchema), userController_1.default.deleteUser);
// Authenticated users (own profile)
router.get("/:id", auth_1.authenticate, (0, validation_1.validateParams)(schemas_1.idParamSchema), userController_1.default.getUserById);
router.put("/:id", auth_1.authenticate, (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateUserSchema), userController_1.default.updateUser);
router.patch("/:id", auth_1.authenticate, (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateUserSchema), userController_1.default.updateUser);
exports.default = router;
