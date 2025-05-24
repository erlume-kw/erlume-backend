"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getDemands = (req, res) => {
    res.send('Retrieving all demands');
};
const getDemandsBySubCategoryId = (req, res) => {
    const subCategoryId = req.params.subCategoryId;
    res.send(`Retrieving demands for subcategory ID: ${subCategoryId}`);
};
const getDemandById = (req, res) => {
    const demandId = req.params.id;
    res.send(`Retrieving demand with ID: ${demandId}`);
};
const createDemand = (req, res) => {
    const newDemand = req.body;
    res.send(`Demand created: ${JSON.stringify(newDemand)}`);
};
const updateDemand = (req, res) => {
    const demandId = req.params.id;
    const updatedData = req.body;
    res.send(`Demand ${demandId} updated with: ${JSON.stringify(updatedData)}`);
};
const deleteDemand = (req, res) => {
    const demandId = req.params.id;
    res.send(`Demand ${demandId} deleted`);
};
exports.default = {
    getDemands,
    getDemandsBySubCategoryId,
    getDemandById,
    createDemand,
    updateDemand,
    deleteDemand
};
