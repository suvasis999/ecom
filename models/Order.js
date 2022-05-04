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
			email: String,
			phone:String,
			address:String,
			city:String,
			pin:String,
			country:String,
			name:String
		},
		status: {
			type: String,
			default: "pending",
			enum: ["pending","approved", "cancelled", "shipped", "delivered"]
		},
		shipmentCompany: {
			type: String,
		},
		consignmentNo: {
			type: String,
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
