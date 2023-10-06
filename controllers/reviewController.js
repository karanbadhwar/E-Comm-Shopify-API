const Review = require("../models/Reviews");
const Product = require("../models/Product");
const { StatusCodes: SC } = require("http-status-codes");
const CheckPermissions = require("../utils/checkPermissions");
const CustomError = require("../errors");

const createReview = async (req, res) => {
  const { product: productId } = req.body;
  const isValidProduct = await Product.findOne({ _id: productId });

  if (!isValidProduct) {
    throw new CustomError.NotFoundError("No product with id " + productId);
  }

  const alreadySubmitted = await Review.findOne({
    product: productId,
    user: req.user.userId,
  });

  if (alreadySubmitted) {
    throw new CustomError.BadRequestError(
      "Already submitted review for this product"
    );
  }

  req.body.user = req.user.userId;

  const review = await Review.create(req.body);
  res.status(SC.CREATED).json([review]);
};
const getAllReviews = async (req, res) => {
  const reviews = await Review.find({}).populate({
    path: "product",
    select: "name company price",
  });
  res.status(SC.OK).json({ reviews, count: reviews.length });
};
const getSingleReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new CustomError.BadRequestError(`No review with id ${reviewId}`);
  }

  res.status(SC.OK).json({ review });
};
const updateReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const { title, comment, rating } = req.body;
  if (!title || !comment || !rating) {
    throw new CustomError.BadRequestError("Please provide all the values");
  }
  const review = await Review.findOne({ _id: reviewId });

  CheckPermissions(req.user, review.user);
  review.title = title;
  review.comment = comment;
  review.rating = rating;

  await review.save();

  res.status(SC.OK).json({ review });
};
const deleteReview = async (req, res) => {
  const { id: reviewId } = req.params;
  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new CustomError.BadRequestError("No review with id ", reviewId);
  }

  CheckPermissions(req.user, review.user);
  await review.remove();

  res.status(SC.OK).json({ msg: "review deleted!" });
};

const getSingleProductReviews = async (req, res) => {
  const { id: productId } = req.params;
  const reviews = await Review.find({ product: productId });
  res.status(SC.OK).json({ reviews, count: reviews.length });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
};
