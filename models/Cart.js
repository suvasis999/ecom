const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartSchema = new Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		products: [
			{
				product_id: {
					type: mongoose.Schema.ObjectId,
					ref: 'Product'
				},
				vendor_id: {
					type: mongoose.Schema.ObjectId,
					ref: 'Vendor'
				},
				quantity: {
					type: Number
				},
			}
		],
	},
	{
		timestamps: true,
	}
);
module.exports = mongoose.model("Cart", CartSchema);
