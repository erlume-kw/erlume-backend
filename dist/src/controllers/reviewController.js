"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getReviews = (req, res) => {
    res.send('Retrieving all reviews');
};
const getReviewsByProductId = (req, res) => {
    const productId = req.params.productId;
    res.send(`Retrieving reviews for product ID: ${productId}`);
};
// review to add role check user is a seller
const getReviewsBySellerId = (req, res) => {
    const userId = req.params.userId;
    res.send(`Retrieving reviews for seller ID: ${userId}`);
};
const getReviewById = (req, res) => {
    const reviewId = req.params.id;
    res.send(`Retrieving review with ID: ${reviewId}`);
};
const createReview = (req, res) => {
    const newReview = req.body;
    res.send(`Review created: ${JSON.stringify(newReview)}`);
};
const updateReview = (req, res) => {
    const reviewId = req.params.id;
    const updatedData = req.body;
    res.send(`Review ${reviewId} updated with: ${JSON.stringify(updatedData)}`);
};
const deleteReview = (req, res) => {
    const reviewId = req.params.id;
    res.send(`Review ${reviewId} deleted`);
};
exports.default = {
    getReviews,
    getReviewsByProductId,
    getReviewsBySellerId,
    getReviewById,
    createReview,
    updateReview,
    deleteReview
};
