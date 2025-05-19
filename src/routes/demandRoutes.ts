import express from 'express';
const router = express.Router();
import demandController from '../controllers/demandController';

// Define routes and map to controller methods
router.get('/', demandController.getDemands);
router.get('/subcategory/:subCategoryId', demandController.getDemandsBySubCategoryId);
router.get('/:id', demandController.getDemandById);
router.post('/', demandController.createDemand);
router.put('/:id', demandController.updateDemand);
router.delete('/:id', demandController.deleteDemand);

export default router; 