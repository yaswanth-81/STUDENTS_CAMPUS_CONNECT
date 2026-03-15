const multer = require("multer");

// In-memory storage; we'll convert file buffer to base64 ourselves
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

module.exports = upload;

