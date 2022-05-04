const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = mongoose.Schema({
	vendor_id: {
		type: Schema.Types.ObjectId,
		ref: "Vendor",
	},
	name: {
		type: String,
		required: [true, "Please Include the product name"],
	},
	category: {
		type: Schema.Types.ObjectId,
		ref: 'Category'
	},
	price: {
		type: String,
		required: [true, "Please Include the product price"],
	},
	price_off: {
		type: Number,
	},
	sell_price:{
		type: Number,
	},
	images: [
		{
			type: String,
		}
	],
	colors: [
		{
			type: String
		}
	],
	size: {
		type: String
	},
	stock: {
		type: Number
	},
	sold: {
		type: Number,
		default: 0
	},
	rateCount: {
		type: Number,
		default: 1
	},
	rateValue: {
		type: Number,
		default: 3
	},
	rating: {
		type: Number,
		default: 3
	},
	product_details: [
		{
			heading: {
				type: String,
			},
			description: {
				type: String,
			},
		}
	]
}, {
    timestamps: true,
});
productSchema.pre('save', function () {
   
    if (this.price_off) {
        this.sell_price = Math.round(this.price - this.price * (this.price_off / 100))
    }
    else {
        this.sell_price = this.price
    }
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;

