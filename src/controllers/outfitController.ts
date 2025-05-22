import { Request, Response } from 'express';

const getOutfits = (req: Request, res: Response) => {
  res.send('Retrieving all outfits');
};

const getOutfitById = (req: Request, res: Response) => {
  const outfitId = req.params.id;
  res.send(`Retrieving outfit with ID: ${outfitId}`);
};

const createOutfit = (req: Request, res: Response) => {
  const newOutfit = req.body;
  res.send(`Outfit created: ${JSON.stringify(newOutfit)}`);
};

const updateOutfit = (req: Request, res: Response) => {
  const outfitId = req.params.id;
  const updatedData = req.body;
  res.send(`Outfit ${outfitId} updated with: ${JSON.stringify(updatedData)}`);
};

const deleteOutfit = (req: Request, res: Response) => {
  const outfitId = req.params.id;
  res.send(`Outfit ${outfitId} deleted`);
};

export default {
  getOutfits,
  getOutfitById,
  createOutfit,
  updateOutfit,
  deleteOutfit
}; 