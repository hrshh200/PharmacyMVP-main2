const mongoose = require("mongoose");

const prescriptionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewedByStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
    reviewedByStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreStaff",
      default: null,
    },
    reviewedByName: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedByRole: {
      type: String,
      default: "",
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewNotes: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrescriptionRequest", prescriptionRequestSchema);
