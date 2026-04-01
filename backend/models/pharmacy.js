const mongoose = require("mongoose");


const pharmacySchema = new mongoose.Schema({
  name: {
    type: String,
    //   require: true,
    //   unique: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  manufacturer: {
    type: String,
    //   require: true,
    //   unique: true,
  },
  dosage: {
    type: String,
    //  require: true
  },
  type: {
    type: String,
    //  require: true
  },
  price: {
    type: Number,
    //  require: true
  },
  stock: {
    type: Number,
    //  require: true
  }
}, { collection: "pharmacy" });




module.exports = mongoose.model("Pharmacy", pharmacySchema);
