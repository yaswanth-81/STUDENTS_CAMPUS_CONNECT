const express = require("express");
const router = express.Router();
const {
  getApplicationsForWork,
  acceptApplication,
  assignApplication,
  assignInterested,
} = require("../controllers/applicationController");
const { protect } = require("../middleware/authMiddleware");

// Get list of applications for a work (owner only)
router.get("/work/:workId", protect, getApplicationsForWork);

// Directly assign an interested (availableForWork) user who never applied
// Must be before /:id routes to avoid conflict
router.post("/assign-interested", protect, assignInterested);

// Accept application and create order + chat (legacy)
router.post("/:id/accept", protect, acceptApplication);

// Assign worker: accept one applicant, mark others as assigned_to_others, create order + chat
router.post("/:id/assign", protect, assignApplication);

module.exports = router;
