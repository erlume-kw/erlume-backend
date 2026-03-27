import express from "express";
const router = express.Router();
import saleController from "../controllers/saleController";
import { validate, validateParams, validateQuery } from "../middleware/validation";
import {
	createSaleSchema,
	updateSaleSchema,
	recalculateSaleCommissionsBodySchema,
	idParamSchema,
	orderIdParamSchema,
	dateFilterQuerySchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", validateQuery(dateFilterQuerySchema), saleController.getSales);
router.get("/order/:orderId", validateParams(orderIdParamSchema), validateQuery(dateFilterQuerySchema), saleController.getSalesByOrderId);
router.post(
	"/recalculate-commissions",
	validate(recalculateSaleCommissionsBodySchema),
	saleController.recalculateSaleCommissions,
);
router.get("/:id", validateParams(idParamSchema), saleController.getSaleById);
router.post("/", validate(createSaleSchema), saleController.createSale);
router.put("/:id", validateParams(idParamSchema), validate(updateSaleSchema), saleController.updateSale);
router.patch("/:id", validateParams(idParamSchema), validate(updateSaleSchema), saleController.updateSale);
router.delete("/:id", validateParams(idParamSchema), saleController.deleteSale);

export default router;
