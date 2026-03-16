const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  getUserProfileById,
  getAvailableUsers,
  deleteProfilePhoto,
  deleteQrCode,
} = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/me", protect, getMyProfile);
router.patch("/me", protect, upload.fields([{ name: "profilePhoto", maxCount: 1 }, { name: "qrCode", maxCount: 1 }]), updateMyProfile);
router.delete("/me/photo", protect, deleteProfilePhoto);
router.delete("/me/qr", protect, deleteQrCode);

// Must be before /:userId to avoid route conflict
router.get("/available", protect, getAvailableUsers);

// Public profile lookup by user id (owner details on Apply page)
router.get("/:userId", getUserProfileById);

module.exports = router;
