const Portfolio = require("../models/Portfolio");

// @desc    Create portfolio item for current user
// @route   POST /api/portfolio
// @access  Private
const createPortfolioItem = async (req, res) => {
  try {
    const { title, description, images, links } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const item = await Portfolio.create({
      userId: req.userId,
      title,
      description,
      images: Array.isArray(images) ? images : [],
      links: Array.isArray(links) ? links : [],
    });

    res.status(201).json({ message: "Portfolio item created", item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get portfolio for a user
// @route   GET /api/portfolio/:userId
// @access  Public
const getPortfolioForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const items = await Portfolio.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ count: items.length, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete portfolio item (owner only)
// @route   DELETE /api/portfolio/:id
// @access  Private
const deletePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Portfolio.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }
    if (item.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this item" });
    }
    await item.deleteOne();
    res.status(200).json({ message: "Portfolio item deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createPortfolioItem,
  getPortfolioForUser,
  deletePortfolioItem,
};

