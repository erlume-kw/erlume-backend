"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getOutfits = (req, res) => {
    res.send('Retrieving all outfits');
};
const getOutfitById = (req, res) => {
    const outfitId = req.params.id;
    res.send(`Retrieving outfit with ID: ${outfitId}`);
};
const createOutfit = (req, res) => {
    const newOutfit = req.body;
    res.send(`Outfit created: ${JSON.stringify(newOutfit)}`);
};
const updateOutfit = (req, res) => {
    const outfitId = req.params.id;
    const updatedData = req.body;
    res.send(`Outfit ${outfitId} updated with: ${JSON.stringify(updatedData)}`);
};
const deleteOutfit = (req, res) => {
    const outfitId = req.params.id;
    res.send(`Outfit ${outfitId} deleted`);
};
exports.default = {
    getOutfits,
    getOutfitById,
    createOutfit,
    updateOutfit,
    deleteOutfit
};
