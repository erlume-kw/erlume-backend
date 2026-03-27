"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const saleController_1 = __importDefault(require("../controllers/saleController"));
const validation_1 = require("../middleware/validation");
const schemas_1 = require("../validations/schemas");
// Define routes and map to controller methods
router.get("/", (0, validation_1.validateQuery)(schemas_1.dateFilterQuerySchema), saleController_1.default.getSales);
router.get("/order/:orderId", (0, validation_1.validateParams)(schemas_1.orderIdParamSchema), (0, validation_1.validateQuery)(schemas_1.dateFilterQuerySchema), saleController_1.default.getSalesByOrderId);
router.post("/recalculate-commissions", (0, validation_1.validate)(schemas_1.recalculateSaleCommissionsBodySchema), saleController_1.default.recalculateSaleCommissions);
router.get("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), saleController_1.default.getSaleById);
router.post("/", (0, validation_1.validate)(schemas_1.createSaleSchema), saleController_1.default.createSale);
router.put("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateSaleSchema), saleController_1.default.updateSale);
router.patch("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), (0, validation_1.validate)(schemas_1.updateSaleSchema), saleController_1.default.updateSale);
router.delete("/:id", (0, validation_1.validateParams)(schemas_1.idParamSchema), saleController_1.default.deleteSale);
exports.default = router;
