const Review = require("../models/Review");
const Order = require("../models/Order");

// @desc    Create a review for an order
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { orderId, targetUserId, rating, comment } = req.body;
    const reviewerId = req.userId;

    if (!orderId || !targetUserId || !rating) {
      return res.status(400).json({ message: "orderId, targetUserId and rating are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.clientId.toString() !== reviewerId &&
      order.workerId.toString() !== reviewerId
    ) {
      return res.status(403).json({ message: "Not authorized to review this order" });
    }

    if (order.status !== "completed") {
      return res.status(400).json({ message: "Order must be completed before reviewing" });
    }

    const review = await Review.create({
      orderId,
      reviewerId,
      targetUserId,
      rating,
      comment,
    });

    res.status(201).json({ message: "Review created", review });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this order" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ targetUserId: userId })
      .populate("reviewerId", "rollNumber fullName")
      .sort({ createdAt: -1 });
    res.status(200).json({ count: reviews.length, reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createReview,
  getReviewsForUser,
};

