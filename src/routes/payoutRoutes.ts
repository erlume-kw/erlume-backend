import express, { RequestHandler } from "express";
import payoutController from "../controllers/payoutController";

const router = express.Router();

router.get("/", payoutController.getAll as RequestHandler);
router.get("/:id", payoutController.getById as RequestHandler);
router.post("/", payoutController.create as RequestHandler);
router.patch("/:id", payoutController.update as RequestHandler);
router.delete("/:id", payoutController.delete as RequestHandler);

export default router;
