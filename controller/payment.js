const Payment = require("../models/payment")
const Order = require("../models/Order")
const mongoose = require('mongoose');
const generateUniqueId = require('generate-unique-id');
const axios = require("axios");

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

async function callTransferBalance(address, amount, token, res) {
    let response = await axios.post('https://drala.io/api/user/transferBlance',
        {
            address: address,
            amount: amount
        }, {
        headers: {
            'Authorization': `${token}`
        }
    });
    return response.data;
}

module.exports.createPayment = async (req, res, next) => {
    try {
        let transactionId = generateUniqueId({
            length: 16,
            useLetters: true,
            useNumbers: true
        });
        transactionId = transactionId + Date.now().toString(32)
        console.info("ID : ", transactionId);
        
        const { statusCodeFromBody, address, amount } = req.body;
        const token = req.header("Authorization") || req.header("authorization")
        let response = await callTransferBalance(address, amount, token, res);
        console.info('response : ', response);
        if (response.message == "Amount transferred") {
            try {
                let newPayment = new Payment({
                    metaData: req.body.metaData,
                    amount: amount,
                    transferFrom: response.data.userDralaAddress,
                    transferTo: address,
                    transactionId: transactionId,
                    status: 'paid',
                    user_id: response.data.user_id
                });
                await newPayment.save();
                await callWebhookApi(statusCodeFromBody);
                return res.status(200).json({
                    success: true,
                    message: "Amount Transferred Successfully",
                    data: newPayment
                })
            } catch (error) {
                console.error("error in saving the paid payment : ", error);
                return res.status(400).json({
                    success: false,
                    message: error
                })
            }
        } else if (response.message == "error in transaction : Error: Returned error: insufficient funds for gas * price + value") {
            try {
                let newPayment = new Payment({
                    metaData: req.body.metaData,
                    amount: amount,
                    transferFrom: response.userDralaAddress,
                    transferTo: address,
                    transactionId: transactionId,
                    status: 'rejected',
                    user_id: response.user_id
                });
                await newPayment.save();
                return res.status(400).json({
                    success: true,
                    message: "Amount Transferred Rejected Due to Insufficient Funds"
                })
            } catch (error) {
                console.error("error in saving the rejected payment : ", error);
                return res.status(400).json({
                    success: false,
                    message: error
                })
            }
        } else {
            try {
                let newPayment = new Payment({
                    metaData: req.body.metaData,
                    amount: amount,
                    transferFrom: response.userDralaAddress,
                    transferTo: address,
                    transactionId: transactionId,
                    status: 'failed',
                    user_id: response.user_id
                });
                await newPayment.save();
                return res.status(400).json({
                    success: true,
                    message: "Amount Transfer failed"
                })
            } catch (error) {
                console.error("error in saving the failed payment : ", error);
                return res.status(500).json({
                    success: false,
                    message: error
                })
            }
        }
    } catch (error) {
        console.error("Error in create Payment :", error);
        return res.status(400).json({
            success: false,
            message: 'Payment Not Created Try it again'
        })
    }
}


async function callWebhookApi(statusCodeFromBody) {
    return new Promise(async(resolve,reject)=>{
        let testWebhookApi = await axios.post('https://drala.io/api/user/testingWebhookApi');
        if(statusCodeFromBody >= 500){
            console.info('waiting for 30 seconds');
            console.info('status code from Body : ',statusCodeFromBody);
            setTimeout(() => callWebhookApi(statusCodeFromBody), "30000");
        }else{
            console.info('Status Code From Body : ',statusCodeFromBody);
            resolve(testWebhookApi.data);
        }
    })
}
