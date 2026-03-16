const User = require("../models/User");

function normalizeOptional(value) {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

// @desc    Get current user's profile
// @route   GET /api/profile/me
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update current user's profile fields
// @route   PATCH /api/profile/me
// @access  Private
const updateMyProfile = async (req, res) => {
  try {
    const allowedFields = [
      "fullName",
      "email",
      "phoneNumber",
      "branch",
      "course",
      "classYear",
      "semester",
      "availableForWork",
    ];

    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        if (["email", "phoneNumber", "fullName", "branch", "course", "classYear", "semester"].includes(key)) {
          const normalized = normalizeOptional(req.body[key]);
          // Only include field in update if it has a value, to avoid duplicate key errors on empty emails
          if (normalized !== null) {
            updates[key] = normalized;
          }
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    // Handle file uploads - convert to base64 data URLs
    if (req.files?.profilePhoto?.[0]) {
      const file = req.files.profilePhoto[0];
      const base64 = file.buffer.toString("base64");
      updates.profilePhotoUrl = `data:${file.mimetype};base64,${base64}`;
    }

    if (req.files?.qrCode?.[0]) {
      const file = req.files.qrCode[0];
      const base64 = file.buffer.toString("base64");
      updates.qrCodeUrl = `data:${file.mimetype};base64,${base64}`;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated", user });
  } catch (error) {
    console.error(error);
    if (error?.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(400).json({
        message: `${duplicateField} is already used by another account`,
        field: duplicateField,
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get any user's public profile (by id)
// @route   GET /api/profile/:userId
// @access  Public
const getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get all users who have set availableForWork = true (same college only)
// @route   GET /api/profile/available
// @access  Private
const getAvailableUsers = async (req, res) => {
  try {
    const userId = req.userId;
    const me = await User.findById(userId).select("college");
    
    // Build filter — same college + available
    const filter = { availableForWork: true };
    if (me?.college) {
      filter.college = me.college;
    }
    // Don't show the requester themselves
    filter._id = { $ne: userId };

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ count: users.length, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete profile photo
// @route   DELETE /api/profile/me/photo
// @access  Private
const deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $unset: { profilePhotoUrl: "" } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile photo deleted", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete QR code
// @route   DELETE /api/profile/me/qr
// @access  Private
const deleteQrCode = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $unset: { qrCodeUrl: "" } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "QR code deleted", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUserProfileById,
  getAvailableUsers,
  deleteProfilePhoto,
  deleteQrCode,
};
