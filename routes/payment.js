const Payment = require("../controller/payment")
const Router = require("express").Router()
const authorization = require("../middleware/authorization")
const role = require("../config/role")
const auth = require('../middleware/auth');

Router.get('/get-payment-details/:payment_id',Payment.getDetails)
Router.post('/cancel-payment/:payment_id',Payment.cancel_payment)
Router.post('/createPayment',Payment.createPayment);
module.exports = Router
