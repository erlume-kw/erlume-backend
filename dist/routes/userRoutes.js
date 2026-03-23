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
// User routes
router.get("/", (0, validation_1.validateQuery)(schemas_1.userFilterQuerySchema), userController_1.default.getUsers);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), userController_1.default.getUserById);
router.post("/", (0, validation_1.validate)(schemas_1.createUserSchema), userController_1.default.createUser);
// Role management routes (must come before generic /:id routes)
router.put("/:id/roles", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateUserRolesSchema), userController_1.default.updateUserRoles);
// Generic user routes (must come after specific routes)
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateUserSchema), userController_1.default.updateUser);
router.patch("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateUserSchema), userController_1.default.updateUser);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), userController_1.default.deleteUser);
exports.default = router;
