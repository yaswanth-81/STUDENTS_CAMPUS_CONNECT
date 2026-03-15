const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  workId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Work",
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // pending → active → completed → (payment flow)
  status: {
    type: String,
    enum: ["pending", "active", "completed", "cancelled"],
    default: "pending",
  },
  // Set by worker when they mark as completed
  completedAt: {
    type: Date,
    default: null,
  },
  // Payment flow — set after worker marks completed
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid_online", "paid_meeting"],
    default: "unpaid",
  },
  // Which payment method the client chose
  paymentMethod: {
    type: String,
    enum: ["qr", "meeting", null],
    default: null,
  },
  // Timestamp when client confirmed payment — used for 3-day auto-cleanup
  paidAt: {
    type: Date,
    default: null,
  },
  price: {
    type: Number,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
