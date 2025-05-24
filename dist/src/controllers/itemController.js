"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getItems = (req, res) => {
    res.send('Retrieving all items');
};
const getItemById = (req, res) => {
    const itemId = req.params.id;
    res.send(`Retrieving item with ID: ${itemId}`);
};
const createItem = (req, res) => {
    const newItem = req.body;
    res.send(`Item created: ${JSON.stringify(newItem)}`);
};
const updateItem = (req, res) => {
    const itemId = req.params.id;
    const updatedData = req.body;
    res.send(`Item ${itemId} updated with: ${JSON.stringify(updatedData)}`);
};
const deleteItem = (req, res) => {
    const itemId = req.params.id;
    res.send(`Item ${itemId} deleted`);
};
exports.default = {
    getItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem
};
