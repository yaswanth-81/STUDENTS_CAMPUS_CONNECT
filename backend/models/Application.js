const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  workId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Work",
    required: true,
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "assigned_to_others"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

applicationSchema.index({ workId: 1, applicantId: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;

