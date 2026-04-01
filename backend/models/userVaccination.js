const mongoose = require("mongoose");

const userVaccinationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vaccineId: {
    type: String,
    required: true,
  },
  vaccineName: {
    type: String,
    required: true,
  },
  vaccinationDate: {
    type: Date,
    required: false,
  },
  nextDueDate: {
    type: Date,
  },
  certificateUrl: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Completed", "Pending", "Overdue"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("UserVaccination", userVaccinationSchema);
