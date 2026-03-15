const express = require("express");
const router = express.Router();
const { signup, login, changePassword, deleteAccount } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/change-password (protected)
router.post("/change-password", protect, changePassword);

// DELETE /api/auth/delete-account (protected)
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;
