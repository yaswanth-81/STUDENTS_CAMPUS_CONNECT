const Application = require("../models/Application");
const Work = require("../models/Work");
const Order = require("../models/Order");
const Chat = require("../models/Chat");
const Notification = require("../models/Notification");
const User = require("../models/User");

// @desc    Get all applications for a specific work (with applicant details)
// @route   GET /api/application/work/:workId
// @access  Private (only work owner)
const getApplicationsForWork = async (req, res) => {
  try {
    const { workId } = req.params;
    const userId = req.userId;

    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ message: "Work post not found" });
    }

    if (work.postedBy.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view applications for this work" });
    }

    const applications = await Application.find({ workId })
      .sort({ createdAt: 1 })
      .populate("applicantId", "rollNumber fullName email phoneNumber branch course classYear semester profilePhotoUrl availableForWork");

    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Accept an application and create order + chat
// @route   POST /api/application/:id/accept
// @access  Private (client only)
const acceptApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const work = await Work.findById(application.workId);
    if (!work) {
      return res.status(404).json({ message: "Work post not found" });
    }

    // Only work owner can accept
    if (work.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to accept this application" });
    }

    // If already accepted, return existing order/chat
    if (application.status === "accepted") {
      const existingOrder = await Order.findOne({
        workId: work._id,
        clientId: work.postedBy,
        workerId: application.applicantId,
      });
      return res.status(200).json({
        message: "Application already accepted",
        order: existingOrder,
      });
    }

    // Create order
    const order = await Order.create({
      workId: work._id,
      clientId: work.postedBy,
      workerId: application.applicantId,
      status: "active",
      price: work.budget,
      deadline: work.deadline,
    });

    // Mark this application accepted and others for same work as rejected
    application.status = "accepted";
    await application.save();

    await Application.updateMany(
      { workId: work._id, _id: { $ne: application._id } },
      { $set: { status: "assigned_to_others" } }
    );

    // Mark work as in progress so it no longer appears in Find Work feed
    work.status = "in-progress";
    await work.save();

    // Create or fetch chat
    let chat = await Chat.findOne({ orderId: order._id });
    if (!chat) {
      chat = await Chat.create({
        orderId: order._id,
        participants: [order.clientId, order.workerId],
      });
    }

    // Get client info for notification message
    const client = await User.findById(req.userId).select("fullName rollNumber");
    const clientName = client?.fullName || client?.rollNumber || "Client";

    // Notification with deep-link
    await Notification.create({
      userId: application.applicantId,
      type: "applicationAccepted",
      message: `Your application for "${work.title}" was accepted by ${clientName}. Tap to view your order.`,
      refId: order._id.toString(),
      refType: "order",
    });

    res.status(201).json({
      message: "Application accepted, order and chat created",
      order,
      chat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Assign worker (same as accept): update application statuses, work status, create order + chat
// @route   POST /api/application/:id/assign
// @access  Private (job owner only)
const assignApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const work = await Work.findById(application.workId);
    if (!work) {
      return res.status(404).json({ message: "Work post not found" });
    }

    if (work.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to assign for this job" });
    }

    if (application.status === "accepted") {
      // Check for an existing non-cancelled order
      const existingOrder = await Order.findOne({
        workId: work._id,
        clientId: work.postedBy,
        workerId: application.applicantId,
        status: { $ne: "cancelled" },
      });
      if (existingOrder) {
        return res.status(200).json({
          message: "Worker already assigned",
          order: existingOrder,
          chat: await Chat.findOne({ orderId: existingOrder._id }),
        });
      }
    }

    // 1. Update selected application -> accepted
    application.status = "accepted";
    await application.save();

    // 2. Update all other applications for this work -> assigned_to_others
    await Application.updateMany(
      { workId: work._id, _id: { $ne: application._id } },
      { $set: { status: "assigned_to_others" } }
    );

    // 3. Update work status -> in progress
    work.status = "in-progress";
    await work.save();

    // 4. Create order
    const order = await Order.create({
      workId: work._id,
      clientId: work.postedBy,
      workerId: application.applicantId,
      status: "active",
      price: work.budget,
      deadline: work.deadline,
    });

    // 5. Create chat session
    const chat = await Chat.create({
      orderId: order._id,
      participants: [order.clientId, order.workerId],
    });

    // Get client info for notification message
    const client = await User.findById(req.userId).select("fullName rollNumber");
    const clientName = client?.fullName || client?.rollNumber || "Client";

    await Notification.create({
      userId: application.applicantId,
      type: "applicationAccepted",
      message: `Your application for "${work.title}" was accepted by ${clientName}. Tap to view your order.`,
      refId: order._id.toString(),
      refType: "order",
    });

    res.status(201).json({
      message: "Worker assigned, order and chat created",
      order,
      chat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Directly assign an interested (available-for-work) user who never applied
// @route   POST /api/application/assign-interested
// @access  Private (job owner only)
const assignInterested = async (req, res) => {
  try {
    const { workId, workerId } = req.body;

    if (!workId || !workerId) {
      return res.status(400).json({ message: "workId and workerId are required" });
    }

    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ message: "Work post not found" });
    }

    if (work.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to assign this job" });
    }

    if (work.status !== "open") {
      return res.status(400).json({ message: "This job is no longer open for assignment" });
    }

    const worker = await User.findById(workerId).select("fullName rollNumber availableForWork");
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }
    if (!worker.availableForWork) {
      return res.status(400).json({ message: "This user is not available for work" });
    }

    // Check for an existing ACTIVE/COMPLETED order (ignore cancelled ones)
    const existingOrder = await Order.findOne({
      workId: work._id,
      status: { $ne: "cancelled" },
    });
    if (existingOrder) {
      return res.status(400).json({ message: "This job already has an assigned worker" });
    }

    // Get client info
    const client = await User.findById(req.userId).select("fullName rollNumber");
    const clientName = client?.fullName || client?.rollNumber || "Client";

    // Create order with pending status so worker can accept/negotiate
    const order = await Order.create({
      workId: work._id,
      clientId: work.postedBy,
      workerId: workerId,
      status: "active",
      price: work.budget,
      deadline: work.deadline,
    });

    // Update work status
    work.status = "in-progress";
    await work.save();

    // Mark all applications as assigned_to_others
    await Application.updateMany(
      { workId: work._id },
      { $set: { status: "assigned_to_others" } }
    );

    // Create chat
    const chat = await Chat.create({
      orderId: order._id,
      participants: [work.postedBy, workerId],
    });

    // Send notification to worker with deep-link to the order
    await Notification.create({
      userId: workerId,
      type: "directAssign",
      message: `New work request from ${clientName} for "${work.title}". Tap to view the full order and negotiate or accept.`,
      refId: order._id.toString(),
      refType: "order",
    });

    res.status(201).json({
      message: "Work request sent to interested student",
      order,
      chat,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getApplicationsForWork,
  acceptApplication,
  assignApplication,
  assignInterested,
};
