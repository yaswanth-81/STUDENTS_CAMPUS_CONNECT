const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cron = require("node-cron");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// ── 3-day auto-cleanup job ───────────────────────────────────────────────────
// Runs at 2 AM every day; removes paid-and-completed orders + related data
// older than 3 days from payment confirmation
cron.schedule("0 2 * * *", async () => {
  try {
    const mongoose = require("mongoose");
    const Order = require("./models/Order");
    const Chat = require("./models/Chat");
    const Message = require("./models/Message");
    const Notification = require("./models/Notification");
    const Application = require("./models/Application");

    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    // Find paid orders older than 3 days
    const oldOrders = await Order.find({
      paidAt: { $lte: cutoff },
      paymentStatus: { $in: ["paid_online", "paid_meeting"] },
    }).select("_id workId");

    if (oldOrders.length === 0) {
      console.log("[Cleanup] No old paid orders to remove.");
      return;
    }

    const orderIds = oldOrders.map((o) => o._id);
    const workIds = [...new Set(oldOrders.map((o) => o.workId?.toString()).filter(Boolean))];

    // Delete chats & messages for these orders
    const chats = await Chat.find({ orderId: { $in: orderIds } }).select("_id");
    const chatIds = chats.map((c) => c._id);
    await Message.deleteMany({ chatId: { $in: chatIds } });
    await Chat.deleteMany({ orderId: { $in: orderIds } });

    // Delete notifications that reference these orders
    await Notification.deleteMany({ refId: { $in: orderIds.map(String) } });

    // Delete applications for these works
    await Application.deleteMany({ workId: { $in: workIds } });

    // Delete orders
    await Order.deleteMany({ _id: { $in: orderIds } });

    console.log(`[Cleanup] Removed ${oldOrders.length} paid order(s) and related data (>3 days after payment).`);
  } catch (err) {
    console.error("[Cleanup] Error:", err.message);
  }
});

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(
  express.json({
    // Increased to comfortably handle a single base64-encoded
    // attachment coming from the Post Work page
    limit: "50mb",
  })
);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/work", require("./routes/workRoutes"));
app.use("/api/application", require("./routes/applicationRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/portfolio", require("./routes/portfolioRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));

// Public stats endpoint — used by landing page (no auth required)
app.get("/api/stats", async (req, res) => {
  try {
    const User = require("./models/User");
    const Work = require("./models/Work");
    const Order = require("./models/Order");
    const [users, openJobs, completedOrders] = await Promise.all([
      User.countDocuments(),
      Work.countDocuments({ status: "open" }),
      Order.countDocuments({ status: "completed" }),
    ]);
    res.json({ users, openJobs, completedOrders });
  } catch (err) {
    res.status(500).json({ users: 0, openJobs: 0, completedOrders: 0 });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "StudentsConnect API is running" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
