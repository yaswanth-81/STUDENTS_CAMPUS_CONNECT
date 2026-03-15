const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: [true, "Roll number is required"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  // Profile fields
  fullName: {
    type: String,
    trim: true,
  },
  college: {
    type: String,
    trim: true,
    default: "JNTUA",
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
    set: (value) => {
      if (value === undefined || value === null) return null;
      const trimmed = String(value).trim();
      return trimmed === "" ? null : trimmed.toLowerCase();
    },
  },
  phoneNumber: {
    type: String,
    trim: true,
    set: (value) => {
      if (value === undefined || value === null) return null;
      const trimmed = String(value).trim();
      return trimmed === "" ? null : trimmed;
    },
  },
  branch: {
    type: String,
    trim: true,
  },
  course: {
    type: String,
    trim: true,
  },
  classYear: {
    type: String,
    trim: true,
  },
  year: {
    type: String,
    trim: true,
  },
  semester: {
    type: String,
    trim: true,
  },
  qrCodeUrl: {
    type: String,
    trim: true,
  },
  profilePhotoUrl: {
    type: String,
    trim: true,
  },
  availableForWork: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function () {
  if (this.isModified("rollNumber") && this.rollNumber) {
    this.rollNumber = this.rollNumber.trim().toUpperCase();
  }

  if (this.isModified("year") && this.year && !this.classYear) {
    this.classYear = this.year;
  }
  if (this.isModified("classYear") && this.classYear && !this.year) {
    this.year = this.classYear;
  }

  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
