import { Request, Response } from 'express';

const getDemands = (req: Request, res: Response) => {
  res.send('Retrieving all demands');
};

const getDemandsBySubCategoryId = (req: Request, res: Response) => {
  const subCategoryId = req.params.subCategoryId;
  res.send(`Retrieving demands for subcategory ID: ${subCategoryId}`);
};

const getDemandById = (req: Request, res: Response) => {
  const demandId = req.params.id;
  res.send(`Retrieving demand with ID: ${demandId}`);
};

const createDemand = (req: Request, res: Response) => {
  const newDemand = req.body;
  res.send(`Demand created: ${JSON.stringify(newDemand)}`);
};

const updateDemand = (req: Request, res: Response) => {
  const demandId = req.params.id;
  const updatedData = req.body;
  res.send(`Demand ${demandId} updated with: ${JSON.stringify(updatedData)}`);
};

const deleteDemand = (req: Request, res: Response) => {
  const demandId = req.params.id;
  res.send(`Demand ${demandId} deleted`);
};

export default {
  getDemands,
  getDemandsBySubCategoryId,
  getDemandById,
  createDemand,
  updateDemand,
  deleteDemand
}; 