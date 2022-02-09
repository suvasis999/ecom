const Order = require("../models/Order");
exports.placeOrder = async (req, res) => {
  try {
    const { productId, quantity, price, address, payment, paymentStatus } = req.body;
    const order = new Order({
      productId: productId,
      quantity: quantity,
      price: price,
      address: address,
      customerId: req.user._id,
      // vendorId: req.product.userId,
      payment: payment,
      paymentStatus: paymentStatus,
    });
    let data = await order.save();
    res.status(200).json({
      type: "successfully order placed",
      msg: "Order Pending",
      data: data
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      type: "Invalid",
      msg: "Something Went Wrong",
      err: err,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    let id = req.params.id;
    let orders = await Order.findById({_id: id });
    res.status(200).json({
      type: "success",
      msg: `order ${orders.status}`,
      data: orders
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      type: "Invalid",
      msg: "Something Went Wrong",
      err: err,
    });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    let id = req.params.id;
    let order = await Order.findById({_id: id });
    order.status = "processing";
    let data = await order.save();
    res.status(200).json({
      type: "success",
      msg: "Order Processing",
      order: data.status,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      type: "Invalid",
      msg: "Something Went Wrong",
      err: err,
    });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    let id = req.params.id;
    let order = await Order.findById({_id: id });
    order.status = "cancelled";
    order.cancel = true;
    order.reasonForCancel = req.body.reasonForCancel;
    let data = await order.save();
    res.status(200).json({
      type: "success",
      msg: "Order Cancelled",
      reason: data.reasonForCancel,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      type: "Invalid",
      msg: "Something Went Wrong",
      err: err,
    });
  }
};

exports.orderShipped = async (req, res) => {
  try {
    let id = req.params.id;
    let order = await Order.findById({_id: id });
    order.status = "shipped";
    order.shippingId = req.body.shippingId;
    order.shippingMethod = req.body.shippingMethod;
    let data = await order.save();
    res.status(200).json({
      type: "success",
      msg: "Order Shipped",
      data: data,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      type: "Invalid",
      msg: "Something Went Wrong",
      err: err,
    });
  }
};
