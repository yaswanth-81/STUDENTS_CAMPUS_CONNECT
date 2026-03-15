const User = require("../models/User");
const Work = require("../models/Work");
const Order = require("../models/Order");
const Application = require("../models/Application");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { verifyAttendanceCredentials } = require("../services/attendanceService");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const generateVerificationToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
};

const toSafeUser = (user) => ({
  id: user._id,
  rollNumber: user.rollNumber,
  fullName: user.fullName || "",
  college: user.college || "JNTUA",
  branch: user.branch || "",
  year: user.year || user.classYear || "",
  email: user.email || "",
  phone: user.phoneNumber || "",
  availableForWork: !!user.availableForWork,
});

const buildRandomPassword = () => crypto.randomBytes(24).toString("hex");

const mergeAttendanceIntoUser = (user, student) => {
  if (!user.fullName && student.fullName) user.fullName = student.fullName;
  user.college = "JNTUA";
  if (!user.branch && student.branch) user.branch = student.branch;
  if (!user.classYear && student.year) user.classYear = student.year;
  if (!user.year && student.year) user.year = student.year;
};

// @desc    Verify JNTUA attendance credentials
// @route   POST /api/auth/verify-attendance
// @access  Public
const verifyAttendance = async (req, res) => {
  try {
    const { rollNumber, attendancePassword } = req.body;

    if (!rollNumber || !attendancePassword) {
      return res.status(400).json({ message: "Please provide roll number and attendance password" });
    }

    const student = await verifyAttendanceCredentials(rollNumber, attendancePassword);
    const user = await User.findOne({ rollNumber: student.rollNumber });

    const verificationToken = generateVerificationToken({
      purpose: "attendance-verification",
      rollNumber: student.rollNumber,
      adminNumber: student.adminNumber || "",
      fullName: student.fullName || "",
      branch: student.branch || "",
      year: student.year || "",
      college: "JNTUA",
    });

    if (user) {
      return res.status(200).json({
        message: "Attendance verified. Continue with StudentsConnect password.",
        token: verificationToken,
        verificationToken,
        requiresPasswordSetup: false,
        user: toSafeUser(user),
      });
    }

    return res.status(200).json({
      message: "Attendance verified. Set your StudentsConnect password to create account.",
      token: verificationToken,
      verificationToken,
      requiresPasswordSetup: true,
      user: {
        rollNumber: student.rollNumber,
        adminNumber: student.adminNumber || "",
        fullName: student.fullName || "",
        college: "JNTUA",
        branch: student.branch || "",
        year: student.year || "",
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 401 ? "Invalid attendance credentials" : "Attendance verification failed";
    return res.status(statusCode).json({ message });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { rollNumber, password, verificationToken } = req.body;

    if (!rollNumber || !password || !verificationToken) {
      return res.status(400).json({ message: "Please verify attendance before signup" });
    }

    let verified;
    try {
      verified = jwt.verify(verificationToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Attendance verification expired. Please verify again." });
    }

    if (verified.purpose !== "attendance-verification") {
      return res.status(401).json({ message: "Invalid attendance verification token" });
    }

    const normalizedRoll = String(rollNumber).trim().toUpperCase();
    if (normalizedRoll !== String(verified.rollNumber || "").trim().toUpperCase()) {
      return res.status(400).json({ message: "Roll number mismatch with verified attendance" });
    }

    const userExists = await User.findOne({ rollNumber: normalizedRoll });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      rollNumber: normalizedRoll,
      password,
      fullName: verified.fullName || "",
      college: "JNTUA",
      branch: verified.branch || "",
      classYear: verified.year || "",
      year: verified.year || "",
    });

    if (user) {
      res.status(201).json({
        message: "User created successfully",
        token: generateToken(user._id),
        user: toSafeUser(user),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { rollNumber, username, attendancePassword, password } = req.body;
    const loginId = (rollNumber || username || "").toString();
    const loginSecret = (attendancePassword || password || "").toString();

    if (!loginId || !loginSecret) {
      return res.status(400).json({ message: "Please provide roll number and attendance password" });
    }

    let student;
    try {
      student = await verifyAttendanceCredentials(loginId, loginSecret);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      const message = statusCode === 401 ? "Invalid attendance credentials" : "Attendance verification failed";
      return res.status(statusCode).json({ message });
    }

    let user = await User.findOne({ rollNumber: student.rollNumber });

    if (!user) {
      user = await User.create({
        rollNumber: student.rollNumber,
        password: buildRandomPassword(),
        fullName: student.fullName || "",
        college: "JNTUA",
        branch: student.branch || "",
        classYear: student.year || "",
        year: student.year || "",
      });
    } else {
      mergeAttendanceIntoUser(user, student);
      await user.save();
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide old and new passwords" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete account permanently
// @route   DELETE /api/auth/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;

    // 1. Find all works posted by user
    const works = await Work.find({ postedBy: userId }).select("_id");
    const workIds = works.map((w) => w._id);

    // 2. Find orders involving user
    const orders = await Order.find({
      $or: [{ clientId: userId }, { workerId: userId }],
    }).select("_id");
    const orderIds = orders.map((o) => o._id);

    // 3. Find chats involving user
    const chats = await Chat.find({ orderId: { $in: orderIds } }).select("_id");
    const chatIds = chats.map((c) => c._id);

    // 4. Delete in order: messages → chats → notifications → applications → orders → works → user
    await Message.deleteMany({ chatId: { $in: chatIds } });
    await Chat.deleteMany({ _id: { $in: chatIds } });
    await Notification.deleteMany({ userId });
    await Application.deleteMany({ $or: [{ applicantId: userId }, { workId: { $in: workIds } }] });
    await Order.deleteMany({ _id: { $in: orderIds } });
    await Work.deleteMany({ postedBy: userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { verifyAttendance, signup, login, changePassword, deleteAccount };
