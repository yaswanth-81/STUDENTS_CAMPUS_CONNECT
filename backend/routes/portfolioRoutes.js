const express = require("express");
const router = express.Router();
const {
  createPortfolioItem,
  getPortfolioForUser,
  deletePortfolioItem,
} = require("../controllers/portfolioController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createPortfolioItem);
router.get("/:userId", getPortfolioForUser);
router.delete("/:id", protect, deletePortfolioItem);

module.exports = router;

