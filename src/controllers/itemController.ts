import { Request, Response } from 'express';

const getItems = (req: Request, res: Response) => {
  res.send('Retrieving all items');
};

const getItemById = (req: Request, res: Response) => {
  const itemId = req.params.id;
  res.send(`Retrieving item with ID: ${itemId}`);
};

const createItem = (req: Request, res: Response) => {
  const newItem = req.body;
  res.send(`Item created: ${JSON.stringify(newItem)}`);
};

const updateItem = (req: Request, res: Response) => {
  const itemId = req.params.id;
  const updatedData = req.body;
  res.send(`Item ${itemId} updated with: ${JSON.stringify(updatedData)}`);
};

const deleteItem = (req: Request, res: Response) => {
  const itemId = req.params.id;
  res.send(`Item ${itemId} deleted`);
};

export default {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
}; 