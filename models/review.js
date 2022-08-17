const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewProductSchema = new mongoose.Schema({
  description: {
    type: String
  },
  rating: {
    type: Number,
    required: true,
  },
  product_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  vendor_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'Vendor'
  },
  feedback:{
    required: true,
    type:String,
    enum:["positive","neutral","negative"]
  },
  isBlocked:{
    type:Boolean,
    default:false
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Review', ReviewProductSchema);

