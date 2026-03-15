const express = require("express");
const router = express.Router();
const {
  createWork,
  getAllWork,
  getMyWork,
  getWorkById,
  getWorkApplicants,
  updateWork,
  deleteWork,
  applyForWork,
} = require("../controllers/workController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// GET all work posts
router.get("/", getAllWork);

// GET work posts created by current user
router.get("/my", protect, getMyWork);

// GET applicants for a work (job owner only) - must be before /:id
router.get("/:id/applicants", protect, getWorkApplicants);

// GET a single work post
router.get("/:id", getWorkById);

// POST a new work post (protected, accepts optional file as 'attachment')
router.post("/", protect, upload.single("attachment"), createWork);

// PUT update a work post (protected, can also replace attachment)
router.put("/:id", protect, upload.single("attachment"), updateWork);

// DELETE a work post (protected)
router.delete("/:id", protect, deleteWork);

// POST apply for a work post (protected)
router.post("/:id/apply", protect, applyForWork);

module.exports = router;
