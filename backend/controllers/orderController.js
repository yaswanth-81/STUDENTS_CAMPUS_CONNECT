const mongoose = require("mongoose");
const Order = require("../models/Order");
const Work = require("../models/Work");
const Application = require("../models/Application");
const Notification = require("../models/Notification");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

// ── helpers ─────────────────────────────────────────────────────────────────

async function _sendChatSystemMessage(orderId, text, messageType = "system") {
  try {
    let chat = await Chat.findOne({ orderId });
    if (!chat) return;
    await Message.create({
      chatId: chat._id,
      senderId: null,         // system message — no real sender
      message: text,
      messageType,
      seenBy: [],
    });
  } catch {}
}

// ── controllers ──────────────────────────────────────────────────────────────

// @desc    Get orders for current user (worker side)
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const userIdRaw = req.userId;
    const userIdStr = String(userIdRaw);
    const userIdObj =
      mongoose.Types.ObjectId.isValid(userIdStr)
        ? new mongoose.Types.ObjectId(userIdStr)
        : null;
    if (!userIdObj) return res.status(400).json({ message: "Invalid user" });

    let orders = await Order.find({ workerId: userIdObj })
      .populate("clientId", "rollNumber fullName")
      .populate("workerId", "rollNumber fullName")
      .populate("workId");

    orders = orders.filter((o) => o.workId && String(o.workId.title || "").trim() !== "");

    const allMyApplications = await Application.find({ applicantId: userIdObj })
      .populate("workId")
      .sort({ createdAt: -1 });

    const pendingList = [];
    const assignedToOthersList = [];

    for (const app of allMyApplications) {
      const raw = app.workId && (app.workId._id || app.workId);
      if (!raw) continue;
      const workIdStr = String(raw);
      if (!mongoose.Types.ObjectId.isValid(workIdStr)) continue;
      const workIdObj = new mongoose.Types.ObjectId(workIdStr);

      const myOrderForThisWork = await Order.findOne({
        workId: workIdObj,
        $or: [{ clientId: userIdObj }, { workerId: userIdObj }],
      });
      if (myOrderForThisWork) continue;

      const anyOrderForWork = await Order.findOne({ workId: workIdObj }).lean();
      if (!anyOrderForWork) {
        pendingList.push(app);
        continue;
      }
      const assignedWorkerStr = anyOrderForWork.workerId
        ? String(anyOrderForWork.workerId)
        : "";
      if (assignedWorkerStr === userIdStr) continue;
      assignedToOthersList.push(app);
    }

    res.status(200).json({
      count: orders.length,
      orders,
      appliedToOthers: assignedToOthersList,
      pendingApplications: pendingList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single order (only participants)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const order = await Order.findById(id)
      .populate("clientId", "rollNumber fullName")
      .populate("workerId", "rollNumber fullName")
      .populate("workId");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (
      order.clientId._id.toString() !== userId &&
      order.workerId._id.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get order for a specific work where the current user participates
// @route   GET /api/orders/by-work/:workId
// @access  Private
const getOrderForWork = async (req, res) => {
  try {
    const { workId } = req.params;
    const userId = req.userId;

    const order = await Order.findOne({
      workId,
      status: { $ne: "cancelled" },
      $or: [{ clientId: userId }, { workerId: userId }],
    })
      .populate("clientId", "rollNumber fullName")
      .populate("workerId", "rollNumber fullName")
      .populate("workId");

    if (!order) return res.status(404).json({ message: "Order not found for this work" });

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update order status (active / completed / cancelled)
//          Cancelling an order reopens the work so others can apply
// @route   PATCH /api/orders/:id/status
// @access  Private (participants only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    if (!["pending", "active", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(id).populate("workId");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (
      order.clientId.toString() !== userId &&
      order.workerId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to update this order" });
    }

    order.status = status;

    if (status === "completed") {
      order.completedAt = new Date();

      // Notify both parties
      await Notification.insertMany([
        {
          userId: order.clientId,
          type: "orderCompleted",
          message: `Work "${order.workId?.title || "Order"}" has been marked as completed. Choose a payment method.`,
          refId: order._id.toString(),
          refType: "order",
        },
        {
          userId: order.workerId,
          type: "orderCompleted",
          message: `You marked "${order.workId?.title || "Order"}" as completed. Waiting for payment from client.`,
          refId: order._id.toString(),
          refType: "order",
        },
      ]);

      // System message in chat
      await _sendChatSystemMessage(
        order._id,
        "✅ Work marked as completed by the worker. Client please choose a payment method below.",
        "system"
      );
    }

    if (status === "cancelled") {
      // Reopen the work so others can apply again
      if (order.workId) {
        await Work.findByIdAndUpdate(order.workId._id || order.workId, {
          $set: { status: "open", applications: [] },
        });

        // Fully reset applicants list for this job; everyone must apply again from scratch.
        await Application.deleteMany({ workId: order.workId._id || order.workId });
      }

      // Notify the other party
      const actor = await User.findById(userId).select("fullName rollNumber");
      const actorName = actor?.fullName || actor?.rollNumber || "The other party";
      const otherUserId =
        order.clientId.toString() === userId ? order.workerId : order.clientId;

      await Notification.create({
        userId: otherUserId,
        type: "orderCompleted",          // reusing type; closest existing enum value
        message: `Order for "${order.workId?.title || "work"}" was cancelled by ${actorName}. The job is now open again.`,
        refId: null,
        refType: null,
      });

      await _sendChatSystemMessage(
        order._id,
        `❌ Order cancelled by ${actorName}. The job has been reopened.`,
        "system"
      );
    }

    await order.save();
    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Client selects payment method (qr or meeting) after work is completed
// @route   PATCH /api/orders/:id/payment-method
// @access  Private (client only)
const selectPaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { method } = req.body; // "qr" or "meeting"
    const userId = req.userId;

    if (!["qr", "meeting"].includes(method)) {
      return res.status(400).json({ message: "method must be 'qr' or 'meeting'" });
    }

    const order = await Order.findById(id).populate("workId");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.clientId.toString() !== userId) {
      return res.status(403).json({ message: "Only the client can select payment method" });
    }
    if (order.status !== "completed") {
      return res.status(400).json({ message: "Order must be completed first" });
    }

    order.paymentMethod = method;
    await order.save();

    const client = await User.findById(userId).select("fullName rollNumber");
    const clientName = client?.fullName || client?.rollNumber || "Client";
    const workTitle = order.workId?.title || "work";

    if (method === "meeting") {
      // Notify worker: client wants to pay by meeting
      await Notification.create({
        userId: order.workerId,
        type: "orderCompleted",
        message: `${clientName} will pay by meeting for "${workTitle}". Meet to exchange payment and receive the assignment.`,
        refId: order._id.toString(),
        refType: "order",
      });

      await _sendChatSystemMessage(
        order._id,
        `💵 Client ${clientName} chose to pay by meeting. Please coordinate a meeting location to exchange the work and payment.`,
        "payment_meeting"
      );
    }

    res.status(200).json({ message: "Payment method selected", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Client confirms payment done (after QR scan or meeting)
// @route   PATCH /api/orders/:id/payment-done
// @access  Private (client only)
const confirmPaymentDone = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const order = await Order.findById(id).populate("workId");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.clientId.toString() !== userId) {
      return res.status(403).json({ message: "Only the client can confirm payment" });
    }
    if (order.status !== "completed") {
      return res.status(400).json({ message: "Order must be marked completed by worker first" });
    }

    const method = order.paymentMethod || "qr";
    order.paymentStatus = method === "meeting" ? "paid_meeting" : "paid_online";
    // Record when payment happened (used for 3-day TTL cleanup)
    order.paidAt = new Date();
    await order.save();

    // Also mark the Work as "completed" so it disappears from in-progress
    if (order.workId) {
      await Work.findByIdAndUpdate(order.workId._id || order.workId, {
        $set: { status: "completed" },
      });
    }

    const client = await User.findById(userId).select("fullName rollNumber");
    const clientName = client?.fullName || client?.rollNumber || "Client";
    const workTitle = order.workId?.title || "work";

    // Notify worker
    await Notification.create({
      userId: order.workerId,
      type: "orderCompleted",
      message: `💰 Payment received from ${clientName} for "${workTitle}"! All done. 🎉`,
      refId: order._id.toString(),
      refType: "order",
    });

    const chatMsg =
      method === "meeting"
        ? `✅ Payment confirmed by ${clientName}. Meeting to exchange payment and the assignment — see you there! 🤝`
        : `✅ Payment of ₹${order.price} received via QR by ${clientName}. Thank you! All done. 🎉`;

    await _sendChatSystemMessage(order._id, chatMsg, "payment_done");

    res.status(200).json({ message: "Payment confirmed", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getOrderForWork,
  selectPaymentMethod,
  confirmPaymentDone,
};
