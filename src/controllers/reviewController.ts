import { Request, Response } from 'express';

const getReviews = (req: Request, res: Response) => {
  res.send('Retrieving all reviews');
};

const getReviewsByProductId = (req: Request, res: Response) => {
  const productId = req.params.productId;
  res.send(`Retrieving reviews for product ID: ${productId}`);
};

// review to add role check user is a seller
const getReviewsBySellerId = (req: Request, res: Response) => {
  const userId = req.params.userId;
  res.send(`Retrieving reviews for seller ID: ${userId}`);
};

const getReviewById = (req: Request, res: Response) => {
  const reviewId = req.params.id;
  res.send(`Retrieving review with ID: ${reviewId}`);
};

const createReview = (req: Request, res: Response) => {
  const newReview = req.body;
  res.send(`Review created: ${JSON.stringify(newReview)}`);
};

const updateReview = (req: Request, res: Response) => {
  const reviewId = req.params.id;
  const updatedData = req.body;
  res.send(`Review ${reviewId} updated with: ${JSON.stringify(updatedData)}`);
};

const deleteReview = (req: Request, res: Response) => {
  const reviewId = req.params.id;
  res.send(`Review ${reviewId} deleted`);
};

export default {
  getReviews,
  getReviewsByProductId,
  getReviewsBySellerId,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
}; 