"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getTransactions = (req, res) => {
    res.send('Retrieving all transactions');
};
const getTransactionsByOrderId = (req, res) => {
    const orderId = req.params.orderId;
    res.send(`Retrieving transactions for order ID: ${orderId}`);
};
const getTransactionById = (req, res) => {
    const transactionId = req.params.id;
    res.send(`Retrieving transaction with ID: ${transactionId}`);
};
const createTransaction = (req, res) => {
    const newTransaction = req.body;
    res.send(`Transaction created: ${JSON.stringify(newTransaction)}`);
};
exports.default = {
    getTransactions,
    getTransactionsByOrderId,
    getTransactionById,
    createTransaction
};
