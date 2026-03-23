"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const router = express_1.default.Router();
const demandController_1 = __importDefault(require("../controllers/demandController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", demandController_1.default.getDemands);
router.get("/subcategory/:subCategoryId", (0, validation_1.validateParams)(zod_1.z.object({ subCategoryId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/) })), demandController_1.default.getDemandsBySubCategoryId);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), demandController_1.default.getDemandById);
router.post("/", (0, validation_1.validate)(schemas_1.createDemandSchema), demandController_1.default.createDemand);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateDemandSchema), demandController_1.default.updateDemand);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), demandController_1.default.deleteDemand);
exports.default = router;
