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
	email: {
		type: String,
		required: [true, 'Email is required'],
		match: [/\S+@\S+\.\S+/, 'Email is invalid']

	},
	phone: {
		type: String,
		required: [true, 'Phone Number is required'],

	},
	password: {
		type: String,
		required: [true, 'Password is required'],
	},
	address: {
		type: String
	},
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
		enum: [role.ADMIN, role.BASIC,  role.VENDOR]
	},
	accessToken: {
		type: String
	},
}, {
    timestamps: true,
});
const User = mongoose.model('User', userSchema);
module.exports = User

