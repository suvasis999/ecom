const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartSchema = new Schema(
	{
		type:{
			type:String,
			required:true,
			enum:["a","b","c"]
			// a is bigger banner, b is below of bigger, c bottom banner
		},
		product_id: {
			type: mongoose.Schema.ObjectId,
			ref: 'Product'
		},
		vendor_id: {
			type: mongoose.Schema.ObjectId,
			ref: 'Vendor'
		},
		title:{
			type:String
		},
		img:{
			type:String
		},
		description:{
			type:String
		},
	},
	{
		timestamps: true,
	}
);
module.exports = mongoose.model("Cart", CartSchema);
