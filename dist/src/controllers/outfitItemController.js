"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getOutfitItems = (req, res) => {
    res.send('Retrieving all outfit items');
};
const getOutfitItemsByOutfitId = (req, res) => {
    const outfitId = req.params.outfitId;
    res.send(`Retrieving outfit items for outfit ID: ${outfitId}`);
};
const getOutfitItemById = (req, res) => {
    const outfitItemId = req.params.id;
    res.send(`Retrieving outfit item with ID: ${outfitItemId}`);
};
const createOutfitItem = (req, res) => {
    const newOutfitItem = req.body;
    res.send(`Outfit item created: ${JSON.stringify(newOutfitItem)}`);
};
const updateOutfitItem = (req, res) => {
    const outfitItemId = req.params.id;
    const updatedData = req.body;
    res.send(`Outfit item ${outfitItemId} updated with: ${JSON.stringify(updatedData)}`);
};
const deleteOutfitItem = (req, res) => {
    const outfitItemId = req.params.id;
    res.send(`Outfit item ${outfitItemId} deleted`);
};
const toggleFeaturedItem = (req, res) => {
    const outfitItemId = req.params.id;
    const { featured } = req.body;
    res.send(`Outfit item ${outfitItemId} featured status set to: ${featured}`);
};
exports.default = {
    getOutfitItems,
    getOutfitItemsByOutfitId,
    getOutfitItemById,
    createOutfitItem,
    updateOutfitItem,
    deleteOutfitItem,
    toggleFeaturedItem
};
