const Wishlist = require("../models/wishlist")
const mongoose = require("mongoose")

module.exports.add = async (req, res, next) => {
	try {
		const {
			user_id, product_id
		} = req.body
		const existWishlist = await Wishlist.findOne({ user_id: user_id })
		if (existWishlist == null) {
			const newWishList = await Wishlist.create({ user_id, products: [product_id] })
			return res.status(200).json({ status: true, msg: "Product added to wishlist", data: newWishList })
		}
		else {
			const update = await Wishlist.findOneAndUpdate({ user_id: user_id }, { $addToSet: { products: product_id } }, { new: true })
			return res.json({ status: true, msg: "Product added to wishlist", data: update })
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.remove = async (req, res, next) => {
	try {
		const {
			user_id, product_id
		} = req.body
		const update = await Wishlist.findOneAndUpdate({ user_id: user_id }, { $pull: { products: product_id } })
		return res.json({ status: true, msg: "Product removed from wishlist",data:update},)
	}
	catch (er) {
		next(er)
	}
}
module.exports.get = async (req, res, next) => {
	try {
		const { user_id } = req.params
		const wish_list = await Wishlist.aggregate([
			{
				$match: {
					user_id: mongoose.Types.ObjectId(user_id)
				}
			},
			{ $unwind: "$products" },
			{
				$lookup: {
					from: "products",
					localField: "products",
					foreignField: "_id",
					as: "product_detail"
				}
			},
			{$unwind:"$product_detail"},
			{
				$project:{
					"product_detail.stock":0,
					"product_detail.sold":0,
				}
			}
		])
		if (wish_list != null) {
			return res.json({ status: true, msg: "Wishlist found", data: wish_list })
		}
		else {
			return res.status(400).json({ status: false, msg: "Wishlist not found" })
		}
	}
	catch (er) {
		next(er)
	}
}

