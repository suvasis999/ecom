const Payment = require("../models/payment")
const Order = require("../models/Order")
const mongoose = require('mongoose');

module.exports.getDetails = async (req, res, next) => {
    try {
        const paymentID = req.params.payment_id
        if (!paymentID) {
            return res.status(400).json({ status: false, msg: "Please provide payment_id" })
        }
        const existPaymentDetails = await Payment.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(paymentID)
                }
            },
            { $unwind: "$orders" },
            {
                $lookup:
                {
                    from: 'orders',
                    localField: "orders",
                    foreignField: "_id",
                    as: "order_details"
                }
            },
            { $unwind: "$order_details" },
            {
                $lookup:
                {
                    from: 'products',
                    localField: "order_details.product_id",
                    foreignField: "_id",
                    as: "product_details"
                }
            },
            { $unwind: "$product_details" },

        ])

        if (existPaymentDetails && existPaymentDetails.length) {
            return res.status(200).json({ status: true, msg: 'Payment Details found', data: existPaymentDetails })
        }
        else {
            return res.status(400).json({ status: false, msg: "Payment Details not found" })
        }
    }
    catch (er) {
        next(er)
    }
}
module.exports.cancel_payment = async (req, res, next) => {
    try {
        const paymentID = req.params.payment_id
        if (!paymentID) {
            return res.status(400).json({ status: false, msg: "Please provide payment_id" })
        }
        const existPayment = await Payment.findById(paymentID)
        if (existPayment != null) {
            await Promise.all(existPayment.orders.map(orderId => {
                return Order.findByIdAndUpdate(orderId, { status: "cancelled" })
            }))
                .then(async() => {
                    existPayment.status = "cancelled"
                    await existPayment.save()
                    return res.status(200).json({ status: true, msg: 'Payment Cancelled', })
                })
        }
        else {
            return res.status(400).json({ status: false, msg: "Payment not found" })
        }
    }
    catch (er) {
        next(er)
    }
}
module.exports.paymentSuccess = async (req, res, next) => {
    try {
        const paymentId = req.params.id
    }
    catch (er) {
        next(er)
    }
}