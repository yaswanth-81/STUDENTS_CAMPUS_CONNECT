const express = require("express");
const router = express.Router();
const {
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getOrderForWork,
  selectPaymentMethod,
  confirmPaymentDone,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

// ── Specific named routes MUST come before /:id  ──────────────────────────
// Otherwise Express treats "payment-method" and "payment-done" as the :id param

// GET routes
router.get("/my", protect, getMyOrders);
router.get("/by-work/:workId", protect, getOrderForWork);

// PATCH sub-routes — MUST be defined before PATCH /:id
router.patch("/:id/status", protect, updateOrderStatus);
router.patch("/:id/payment-method", protect, selectPaymentMethod);
router.patch("/:id/payment-done", protect, confirmPaymentDone);

// Generic GET /:id — keep last among GETs
router.get("/:id", protect, getOrderById);

module.exports = router;
