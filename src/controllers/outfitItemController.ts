import { Request, Response } from 'express';

const getOutfitItems = (req: Request, res: Response) => {
  res.send('Retrieving all outfit items');
};

const getOutfitItemsByOutfitId = (req: Request, res: Response) => {
  const outfitId = req.params.outfitId;
  res.send(`Retrieving outfit items for outfit ID: ${outfitId}`);
};

const getOutfitItemById = (req: Request, res: Response) => {
  const outfitItemId = req.params.id;
  res.send(`Retrieving outfit item with ID: ${outfitItemId}`);
};

const createOutfitItem = (req: Request, res: Response) => {
  const newOutfitItem = req.body;
  res.send(`Outfit item created: ${JSON.stringify(newOutfitItem)}`);
};

const updateOutfitItem = (req: Request, res: Response) => {
  const outfitItemId = req.params.id;
  const updatedData = req.body;
  res.send(`Outfit item ${outfitItemId} updated with: ${JSON.stringify(updatedData)}`);
};

const deleteOutfitItem = (req: Request, res: Response) => {
  const outfitItemId = req.params.id;
  res.send(`Outfit item ${outfitItemId} deleted`);
};

const toggleFeaturedItem = (req: Request, res: Response) => {
  const outfitItemId = req.params.id;
  const { featured } = req.body;
  res.send(`Outfit item ${outfitItemId} featured status set to: ${featured}`);
};

export default {
  getOutfitItems,
  getOutfitItemsByOutfitId,
  getOutfitItemById,
  createOutfitItem,
  updateOutfitItem,
  deleteOutfitItem,
  toggleFeaturedItem
}; 