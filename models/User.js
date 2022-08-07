var mongoose = require("mongoose");
const Schema = mongoose.Schema;
const role = require("../config/role")
var userSchema = new Schema({
	firstname: {
		type: String,
		required: [true, 'firstname is required'],
	},
	lastname: {
		type: String,
		required: [true, 'lastname is required'],
	},
	userName: {
		type: String,
		required: [true, 'userName is required'],
	},

	email: {
		type: String,
		required: [true, 'Email is required'],
		match: [/\S+@\S+\.\S+/, 'Email is invalid']

	},
	phone: {
		type: String,
	},
	wallet: {
		type: String,
	},
	password: {
		type: String,
		required: [true, 'Password is required'],
	},
	address: [{
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
		isDefault:{
			type:Boolean,
			default:false
		}
	}],
	isVerified: {
		type: Boolean,
		default: false
	},
	verification: {
		otp: Number,
		send_by: {
			type: String,
			enum: ["email", "phone"]
		},
		send_at: Date,
		verified_token: String,
	},
	role: {
		type: String,
		default: role.BASIC,
		enum: [role.ADMIN, role.BASIC, role.VENDOR]
	},
	accessToken: {
		type: String
	},
}, {
	timestamps: true,
});
const User = mongoose.model('User', userSchema);
module.exports = User

