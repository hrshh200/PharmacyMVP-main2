const mongoose = require("mongoose");

const userVaccinationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vaccinationMasterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VaccinationMaster",
    required: true,
  },
  vaccinationDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ["Completed", "Pending"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// One vaccination record per user per vaccine master entry.
userVaccinationSchema.index(
  { userId: 1, vaccinationMasterId: 1 },
  { unique: true, name: "userId_1_vaccinationMasterId_1" }
);

module.exports = mongoose.model("UserVaccination", userVaccinationSchema);
