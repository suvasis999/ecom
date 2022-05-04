const Payment = require("../controller/payment")
const Router = require("express").Router()
const authorization = require("../middleware/authorization")
const role = require("../config/role")

Router.get('/get-payment-details/:payment_id',Payment.getDetails)

module.exports = Router
