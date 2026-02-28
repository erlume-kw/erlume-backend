"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const saleController_1 = __importDefault(require("../controllers/saleController"));
// Define routes and map to controller methods
router.get("/", saleController_1.default.getSales);
router.get("/order/:orderId", saleController_1.default.getSalesByOrderId);
router.post("/recalculate-commissions", saleController_1.default.recalculateSaleCommissions);
router.get("/:id", saleController_1.default.getSaleById);
router.post("/", saleController_1.default.createSale);
router.put("/:id", saleController_1.default.updateSale);
router.patch("/:id", saleController_1.default.updateSale);
router.delete("/:id", saleController_1.default.deleteSale);
exports.default = router;
