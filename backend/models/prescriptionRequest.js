const mongoose = require("mongoose");

const approvedItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: String,
      default: "",
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      default: "",
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    substitution: {
      isSubstituted: {
        type: Boolean,
        default: false,
      },
      originalName: {
        type: String,
        default: "",
        trim: true,
      },
      reason: {
        type: String,
        default: "",
        trim: true,
      },
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const approvalSnapshotSchema = new mongoose.Schema(
  {
    approvedItems: {
      type: [approvedItemSchema],
      default: [],
    },
    totals: {
      subtotal: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      deliveryCharge: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
      currency: { type: String, default: "INR", trim: true },
    },
    quoteExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

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
    fileKey: {
      type: String,
      default: '',
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "ordered"],
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
    approvalSnapshot: {
      type: approvalSnapshotSchema,
      default: null,
    },
    orderedOrderId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    orderedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrescriptionRequest", prescriptionRequestSchema);
