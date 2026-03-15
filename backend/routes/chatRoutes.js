const express = require("express");
const router = express.Router();
const {
  startChat,
  getChatByOrder,
  sendMessage,
  markChatSeen,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.post("/start", protect, startChat);
router.post("/message", protect, sendMessage);
router.patch("/:orderId/seen", protect, markChatSeen);
router.get("/:orderId", protect, getChatByOrder);

module.exports = router;
