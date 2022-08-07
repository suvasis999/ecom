const mongoose = require("mongoose");
const Schema = mongoose.Schema;
let OrderScema = new Schema(
	{
		product_id: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "Product",
		},
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		vendor_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Vendor",
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: [1, "Quantity can not be less then 1."],
		},
		address: {
			name: String,
			email: String,
			phone: String,
			address_line_1: String,
			address_line_2: String,
			address_line_3: String,
			zip_code: String,
			landmark: String,
			state: String,
			country: String,
		},
		status: {
			type: String,
			default: "pending",
			enum: ["pending", "approved", "cancelled", "shipped", "delivered"]
		},
		shipmentCompany: {
			type: String,
		},
		consignmentNo: {
			type: String,
		},
		shippingDate:{
			type :Date
		},
		price: {
			type: Number,
		},
		reasonForCancel: {
			type: String,
		},
		is_paid: {
			type: Boolean,
			default: false,
		},
		payment: {
			type: String,
		},
		paymentStatus: {
			type: String,
			default: "pending",
			enum: ['pending', 'paid', 'rejected', 'failed']
		},
		date: {
			type: String,
			default: new Date()
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Order", OrderScema);
