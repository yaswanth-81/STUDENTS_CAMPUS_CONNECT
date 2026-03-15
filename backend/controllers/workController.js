const Work = require("../models/Work");
const Application = require("../models/Application");
const Notification = require("../models/Notification");

// @desc    Create a new work post
// @route   POST /api/work
// @access  Private
const createWork = async (req, res) => {
  try {
    const { title, description, category, budget, deadline } = req.body;

    // Validate required fields
    if (!title || !description || !category || !budget || !deadline) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Prepare attachments: either from uploaded file or JSON body
    let attachments = [];
    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      attachments.push({
        fileName: req.file.originalname,
        fileUrl: dataUrl,
      });
    } else if (Array.isArray(req.body.attachments)) {
      attachments = req.body.attachments;
    }

    // Create work post
    const work = await Work.create({
      title,
      description,
      category,
      budget: Number(budget),
      deadline: new Date(deadline),
      postedBy: req.userId, // set by auth middleware
      attachments,
    });

    res.status(201).json({
      message: "Work post created successfully",
      work,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all work posts (public feed; college-isolated for logged in users)
// @route   GET /api/work
// @access  Public (but filtered by college when authenticated)
const getAllWork = async (req, res) => {
  try {
    const { category, search, status, includeAll } = req.query;

    // Delete expired open jobs so they no longer appear anywhere
    await Work.deleteMany({
      status: "open",
      deadline: { $lt: new Date() },
    });

    // Build filter object
    const filter = {};

    if (category) filter.category = category;

    if (status) {
      filter.status = status;
    } else if (includeAll !== "true") {
      filter.status = "open";
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // ── College isolation ────────────────────────────────────────────────────
    // If the request carries a valid JWT, restrict to same college.
    // Unauthenticated (landing page preview) gets all colleges.
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const User = require("../models/User");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const me = await User.findById(decoded.id).select("college");
        if (me?.college) {
          // Find all users with same college, restrict results
          const sameCollegeUsers = await User.find({ college: me.college }).select("_id");
          filter.postedBy = { $in: sameCollegeUsers.map((u) => u._id) };
        }
      } catch {
        // Invalid/expired token — no college filter (treat as public)
      }
    }

    const works = await Work.find(filter)
      .populate("postedBy", "rollNumber fullName college branch")
      .sort({ createdAt: -1 });

    res.status(200).json({ count: works.length, works });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get work posts created by current user
// @route   GET /api/work/my
// @access  Private
const getMyWork = async (req, res) => {
  try {
    const works = await Work.find({ postedBy: req.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: works.length,
      works,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all applicants for a work (job owner only)
// @route   GET /api/work/:id/applicants
// @access  Private
const getWorkApplicants = async (req, res) => {
  try {
    const { id: workId } = req.params;
    const userId = req.userId;

    const work = await Work.findById(workId);
    if (!work) {
      return res.status(404).json({ message: "Work post not found" });
    }
    if (work.postedBy.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to view applicants for this work" });
    }

    const applications = await Application.find({ workId })
      .sort({ createdAt: 1 })
      .populate("applicantId", "rollNumber fullName email phoneNumber branch course classYear semester profilePhotoUrl");

    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get a single work post
// @route   GET /api/work/:id
// @access  Public
const getWorkById = async (req, res) => {
  try {
    const { id } = req.params;

    const work = await Work.findById(id).populate({
      path: "postedBy",
      // send all profile fields but never the password hash
      select: "-password",
    });

    if (!work) {
      return res.status(404).json({ message: "Work post not found" });
    }

    res.status(200).json(work);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a work post
// @route   PUT /api/work/:id
// @access  Private
const updateWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, budget, deadline, status } = req.body || {};

    let work = await Work.findById(id);

    if (!work) {
      return res.status(404).json({ message: "Work post not found" });
    }

    // Check if user is the owner
    if (work.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to update this work" });
    }

    // Update fields
    if (title) work.title = title;
    if (description) work.description = description;
    if (category) work.category = category;
    if (budget) work.budget = Number(budget);
    if (deadline) work.deadline = new Date(deadline);
    if (status) work.status = status;

    // If a new attachment is uploaded, replace existing attachments
    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      work.attachments = [
        {
          fileName: req.file.originalname,
          fileUrl: dataUrl,
        },
      ];
    }

    work.updatedAt = Date.now();
    work = await work.save();

    res.status(200).json({
      message: "Work post updated successfully",
      work,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a work post
// @route   DELETE /api/work/:id
// @access  Private
const deleteWork = async (req, res) => {
  try {
    const { id } = req.params;

    const work = await Work.findById(id);

    if (!work) {
      return res.status(404).json({ message: "Work post not found" });
    }

    // Check if user is the owner
    if (work.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this work" });
    }

    await Work.findByIdAndDelete(id);

    res.status(200).json({ message: "Work post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Apply for a work post
// @route   POST /api/work/:id/apply
// @access  Private
const applyForWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body || {};

    const work = await Work.findById(id);

    if (!work) {
      return res.status(404).json({ message: "Work post not found" });
    }

    // Prevent duplicate applications via unique index as well as manual check
    const existing = await Application.findOne({
      workId: work._id,
      applicantId: req.userId,
    });

    if (existing) {
      return res.status(400).json({ message: "You have already applied for this work" });
    }

    const application = await Application.create({
      workId: work._id,
      applicantId: req.userId,
      message,
    });

    // Keep lightweight count on Work for quick display
    work.applications.push({
      userId: req.userId,
      appliedAt: new Date(),
    });
    await work.save();

    // Notify client that someone applied
    await Notification.create({
      userId: work.postedBy,
      type: "application",
      message: `New application for "${work.title}"`,
    });

    // Order is created only when owner assigns a worker (POST /api/application/:id/assign)
    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error(error);
    // Handle duplicate key from unique index
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already applied for this work" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createWork,
  getAllWork,
  getMyWork,
  getWorkById,
  getWorkApplicants,
  updateWork,
  deleteWork,
  applyForWork,
};
