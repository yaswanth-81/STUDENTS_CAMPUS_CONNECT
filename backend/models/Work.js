const mongoose = require("mongoose");

const workSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
  },
  budget: {
    type: Number,
    required: [true, "Budget is required"],
    min: [39, "Budget must be at least ₹39"],
  },
  deadline: {
    type: Date,
    required: [true, "Deadline is required"],
  },
  status: {
    type: String,
    enum: ["open", "in-progress", "assigned", "completed", "closed"],
    default: "open",
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  applications: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      appliedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  attachments: [
    {
      fileName: String,
      fileUrl: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Work = mongoose.model("Work", workSchema);

module.exports = Work;
