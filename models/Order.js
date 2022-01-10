const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let OrderScema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity can not be less then 1."],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
      default: "pending",
    },
    shippingId: {
      type: String,
      required: false,
    },
    shippingMethod: {
      type: String,
      required: false,
    },

    price: {
      type: Number,
      required: true,
    },
    cancel: {
      type: String,
      required: false,
      default: false,
    },
    reasonForCancel: {
      type: String,
      required: false,
      default: false,
    },
    payment: {
      type: String,
      required: false,
    },
    paymentStatus: {
      type: String,
      required: false,
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", OrderScema);
