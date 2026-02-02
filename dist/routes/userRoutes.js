"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const userController_1 = __importDefault(require("../controllers/userController"));
// User routes
router.get("/", userController_1.default.getUsers);
router.get("/:id", userController_1.default.getUserById);
router.post("/", userController_1.default.createUser);
// Role management routes (must come before generic /:id routes)
router.put("/:id/roles", userController_1.default.updateUserRoles);
// Generic user routes (must come after specific routes)
router.put("/:id", userController_1.default.updateUser);
router.delete("/:id", userController_1.default.deleteUser);
exports.default = router;
