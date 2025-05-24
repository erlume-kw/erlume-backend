"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getOrderItems = (req, res) => {
    res.send('Retrieving all order items');
};
const getOrderItemsByOrderId = (req, res) => {
    const orderId = req.params.orderId;
    res.send(`Retrieving order items for order ID: ${orderId}`);
};
const getOrderItemById = (req, res) => {
    const orderItemId = req.params.id;
    res.send(`Retrieving order item with ID: ${orderItemId}`);
};
const createOrderItem = (req, res) => {
    const newOrderItem = req.body;
    res.send(`Order item created: ${JSON.stringify(newOrderItem)}`);
};
const updateOrderItem = (req, res) => {
    const orderItemId = req.params.id;
    const updatedData = req.body;
    res.send(`Order item ${orderItemId} updated with: ${JSON.stringify(updatedData)}`);
};
const deleteOrderItem = (req, res) => {
    const orderItemId = req.params.id;
    res.send(`Order item ${orderItemId} deleted`);
};
const markOrderItemReturned = (req, res) => {
    const orderItemId = req.params.id;
    res.send(`Order item ${orderItemId} marked as returned`);
};
exports.default = {
    getOrderItems,
    getOrderItemsByOrderId,
    getOrderItemById,
    createOrderItem,
    updateOrderItem,
    deleteOrderItem,
    markOrderItemReturned
};
