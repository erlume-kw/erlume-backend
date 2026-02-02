import express from "express";
const router = express.Router();
import dropController from "../controllers/dropController";

// Define routes and map to controller methods
router.get("/", dropController.getDrops);
router.post("/", dropController.createDrop);

// Drop items routes (must come before /:id to avoid route conflicts)
router.get("/:id/items", dropController.getDropItems);
router.post("/:id/items", dropController.addItemToDrop);
router.delete("/:id/items/:itemId", dropController.removeItemFromDrop);

// Drop CRUD routes
router.get("/:id", dropController.getDropById);
router.put("/:id", dropController.updateDrop);
router.delete("/:id", dropController.deleteDrop);

export default router;
