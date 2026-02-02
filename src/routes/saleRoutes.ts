import express from "express";
const router = express.Router();
import saleController from "../controllers/saleController";

// Define routes and map to controller methods
router.get("/", saleController.getSales);
router.get("/order/:orderId", saleController.getSalesByOrderId);
router.get("/:id", saleController.getSaleById);
router.post("/", saleController.createSale);
router.put("/:id", saleController.updateSale);
router.patch("/:id", saleController.updateSale);
router.delete("/:id", saleController.deleteSale);

export default router;
