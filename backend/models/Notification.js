const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["application", "applicationAccepted", "message", "orderCompleted", "directAssign"],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  // refId — the ID to deep-link into (orderId, workId, etc.)
  refId: {
    type: String,
    default: null,
  },
  // refType — tells the frontend which page to navigate to
  refType: {
    type: String,
    enum: ["order", "work", "chat", null],
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;

