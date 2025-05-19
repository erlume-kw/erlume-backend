import { Request, Response } from 'express';

const getOrderItems = (req: Request, res: Response) => {
  res.send('Retrieving all order items');
};

const getOrderItemsByOrderId = (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  res.send(`Retrieving order items for order ID: ${orderId}`);
};

const getOrderItemById = (req: Request, res: Response) => {
  const orderItemId = req.params.id;
  res.send(`Retrieving order item with ID: ${orderItemId}`);
};

const createOrderItem = (req: Request, res: Response) => {
  const newOrderItem = req.body;
  res.send(`Order item created: ${JSON.stringify(newOrderItem)}`);
};

const updateOrderItem = (req: Request, res: Response) => {
  const orderItemId = req.params.id;
  const updatedData = req.body;
  res.send(`Order item ${orderItemId} updated with: ${JSON.stringify(updatedData)}`);
};

const deleteOrderItem = (req: Request, res: Response) => {
  const orderItemId = req.params.id;
  res.send(`Order item ${orderItemId} deleted`);
};

const markOrderItemReturned = (req: Request, res: Response) => {
  const orderItemId = req.params.id;
  res.send(`Order item ${orderItemId} marked as returned`);
};

export default {
  getOrderItems,
  getOrderItemsByOrderId,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  markOrderItemReturned
}; 