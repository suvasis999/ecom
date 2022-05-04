const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wishlistSchema = mongoose.Schema({
	user_id: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
	products: [{
		type: Schema.Types.ObjectId,
		ref: "Product",
	}]
}, {
	timestamps: true,
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
module.exports = Wishlist;

