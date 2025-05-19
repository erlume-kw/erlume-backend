import { Request, Response } from 'express';

const getSellers = (req: Request, res: Response) => {
  res.send('Retrieving all sellers');
};

const getSellerById = (req: Request, res: Response) => {
  const sellerId = req.params.id;
  res.send(`Retrieving seller with ID: ${sellerId}`);
};

const createSeller = (req: Request, res: Response) => {
  const newSeller = req.body;
  res.send(`Seller created: ${JSON.stringify(newSeller)}`);
};

const updateSeller = (req: Request, res: Response) => {
  const sellerId = req.params.id;
  const updatedData = req.body;
  res.send(`Seller ${sellerId} updated with: ${JSON.stringify(updatedData)}`);
};

const deleteSeller = (req: Request, res: Response) => {
  const sellerId = req.params.id;
  res.send(`Seller ${sellerId} deleted`);
};

export default {
  getSellers,
  getSellerById,
  createSeller,
  updateSeller,
  deleteSeller
}; 