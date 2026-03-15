const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/my", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/mark-all-read", protect, markAllRead);
router.patch("/:id/read", protect, markNotificationRead);

module.exports = router;
