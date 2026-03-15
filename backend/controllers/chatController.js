const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const User = require("../models/User");

// @desc    Start or get chat for an order
// @route   POST /api/chat/start
// @access  Private (order participants only)
const startChat = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.userId;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.clientId.toString() !== userId &&
      order.workerId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to access this order chat" });
    }

    let chat = await Chat.findOne({ orderId: order._id });
    if (!chat) {
      chat = await Chat.create({
        orderId: order._id,
        participants: [order.clientId, order.workerId],
      });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get chat page data: order details, client, worker, messages (participants only)
// @route   GET /api/chat/:orderId
// @access  Private (participants only)
const getChatByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await Order.findById(orderId)
      .populate("workId")
      .populate("clientId", "-password")
      .populate("workerId", "-password");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.clientId._id.toString() !== userId &&
      order.workerId._id.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to access this chat" });
    }

    let chat = await Chat.findOne({ orderId: order._id });
    if (!chat) {
      const clientId = order.clientId._id || order.clientId;
      const workerId = order.workerId._id || order.workerId;
      chat = await Chat.create({
        orderId: order._id,
        participants: [clientId, workerId],
      });
    }

    const messages = await Message.find({ chatId: chat._id })
      .sort({ timestamp: 1 })
      .populate("senderId", "rollNumber fullName");

    // Mark all unread messages (not sent by me) as seen
    await Message.updateMany(
      {
        chatId: chat._id,
        senderId: { $ne: userId },
        seenBy: { $nin: [userId] },
      },
      { $addToSet: { seenBy: userId } }
    );

    res.status(200).json({
      order,
      client: order.clientId,
      worker: order.workerId,
      messages,
      chat,
      myId: userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Send a message in an order chat
// @route   POST /api/chat/message
// @access  Private (participants only)
const sendMessage = async (req, res) => {
  try {
    const { orderId, message } = req.body;
    const userId = req.userId;

    if (!orderId || !message) {
      return res.status(400).json({ message: "orderId and message are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      order.clientId.toString() !== userId &&
      order.workerId.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not authorized to send messages in this chat" });
    }

    let chat = await Chat.findOne({ orderId: order._id });
    if (!chat) {
      chat = await Chat.create({
        orderId: order._id,
        participants: [order.clientId, order.workerId],
      });
    }

    const newMessage = await Message.create({
      chatId: chat._id,
      senderId: userId,
      message,
      messageType: "text",
      seenBy: [userId], // sender already saw it
    });

    // Notification for the other participant with deep-link to order
    const recipientId =
      order.clientId.toString() === userId ? order.workerId : order.clientId;

    const sender = await User.findById(userId).select("fullName rollNumber");
    const senderName = sender?.fullName || sender?.rollNumber || "Someone";

    await Notification.create({
      userId: recipientId,
      type: "message",
      message: `💬 ${senderName} sent you a message in "${order.workId || "order"}" chat.`,
      refId: order._id.toString(),
      refType: "order",
    });

    const populated = await newMessage.populate("senderId", "rollNumber fullName");

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Mark all messages in a chat as seen by the current user
// @route   PATCH /api/chat/:orderId/seen
// @access  Private (participants only)
const markChatSeen = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const chat = await Chat.findOne({ orderId });
    if (!chat) return res.status(200).json({ message: "No chat found" });

    await Message.updateMany(
      {
        chatId: chat._id,
        senderId: { $ne: userId },
        seenBy: { $nin: [userId] },
      },
      { $addToSet: { seenBy: userId } }
    );

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  startChat,
  getChatByOrder,
  sendMessage,
  markChatSeen,
};
