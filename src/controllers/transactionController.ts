import { Request, Response } from 'express';

const getTransactions = (req: Request, res: Response) => {
  res.send('Retrieving all transactions');
};

const getTransactionsByOrderId = (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  res.send(`Retrieving transactions for order ID: ${orderId}`);
};

const getTransactionById = (req: Request, res: Response) => {
  const transactionId = req.params.id;
  res.send(`Retrieving transaction with ID: ${transactionId}`);
};

const createTransaction = (req: Request, res: Response) => {
  const newTransaction = req.body;
  res.send(`Transaction created: ${JSON.stringify(newTransaction)}`);
};

export default {
  getTransactions,
  getTransactionsByOrderId,
  getTransactionById,
  createTransaction
}; 