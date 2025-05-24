"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getOrders = (req, res) => {
    res.send('Retrieving all orders');
};
const getOrdersByUserId = (req, res) => {
    const userId = req.params.userId;
    res.send(`Retrieving orders for user ID: ${userId}`);
};
const getOrderById = (req, res) => {
    const orderId = req.params.id;
    res.send(`Retrieving order with ID: ${orderId}`);
};
const createOrder = (req, res) => {
    const newOrder = req.body;
    res.send(`Order created: ${JSON.stringify(newOrder)}`);
};
const updateOrderStatus = (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    res.send(`Order ${orderId} status updated to: ${status}`);
};
const deleteOrder = (req, res) => {
    const orderId = req.params.id;
    res.send(`Order ${orderId} deleted`);
};
exports.default = {
    getOrders,
    getOrdersByUserId,
    getOrderById,
    createOrder,
    updateOrderStatus,
    deleteOrder
};
