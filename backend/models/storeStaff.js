const mongoose = require('mongoose');

const StoreStaffSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, default: '', trim: true },
    lastName: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      trim: true,
      enum: ['Store Admin', 'Manager', 'Pharmacist', 'Operator', 'Technician'],
      default: 'Pharmacist',
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    contact: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

StoreStaffSchema.index({ storeId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('StoreStaff', StoreStaffSchema);
