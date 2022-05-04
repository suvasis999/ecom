const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const vendorSchema = new Schema({
	user_id: {
		type: Schema.ObjectId,
		ref: "User",
		required: [true, "You must have register as an user and provide id"]
	},
	name: {
		type: String,
		required: [true, 'Name is required'],
	},
	email: {
		type: String,
		required: [true, 'Email is required'],
		match: [/\S+@\S+\.\S+/, 'Email is invalid']
	},
	phone: {
		type: String,
		required: [true, 'Phone number is required'],

	},
	company_name: {
		type: String
	},
	doc_1: {
		type: String,
	},
	doc_2: {
		type: String,
	},
	doc_3: {
		type: String,
	},
	status: {
		type: String,
		default: 'Pending',
		enum: ["Pending", "Approved", "Rejected"]
	},
	reject_reason:String,
	average_rating:{
		type:Number,
		default:0
	},
	total_rating:{
		type:Number,
		default:0
	}
}, {
	timestamps: true,
});

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;