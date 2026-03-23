import express from "express";
import { z } from "zod";
const router = express.Router();
import demandController from "../controllers/demandController";
import { validate, validateParams } from "../middleware/validation";
import {
	createDemandSchema,
	updateDemandSchema,
	idParamSchema,
} from "../validations/schemas";

// Define routes and map to controller methods
router.get("/", demandController.getDemands);
router.get("/subcategory/:subCategoryId", validateParams(z.object({ subCategoryId: z.string().regex(/^[0-9a-fA-F]{24}$/) })), demandController.getDemandsBySubCategoryId);
router.get("/:id", validateParams(idParamSchema), demandController.getDemandById);
router.post("/", validate(createDemandSchema), demandController.createDemand);
router.put("/:id", validateParams(idParamSchema), validate(updateDemandSchema), demandController.updateDemand);
router.delete("/:id", validateParams(idParamSchema), demandController.deleteDemand);

export default router; 