const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    sourceType: { type: String, enum: ["cart", "prescription"], default: "cart", index: true },
    sourcePrescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "PrescriptionRequest", default: null, index: true },
    items: { type: [orderItemSchema], default: [] },
    totalPrice: { type: Number, required: true },
    payment: { type: String, required: true, default: "Pending" },
    address: { type: String, required: true, default: "TBD" },
    status: { type: String, required: true, default: "Pending" },
    deliveryType: { type: String, enum: ["pickup", "delivery"], required: true, default: "delivery" },
    trackingStatus: { type: String, required: true, default: "Order Placed" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
