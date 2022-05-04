const Order = require("../models/Order")
const Product = require("../models/Product")
const Cart = require("../models/Cart")
const Payment = require("../models/payment")
const mongoose = require("mongoose")

module.exports.createOrder = async (req, res, next) => {
	try {
		const {
			user_id, quantity, product_id, address
		} = req.body
		if (!user_id || !quantity || !product_id) {
			return res.status(400).send({ status: false, msg: 'Please provide user_id & quantity & product_id' });
		}
		const product_detail = await Product.findOne({ _id: product_id, $gt: { stock: 0 } })
		if (!product_detail) {
			return res.status(400).send({ status: false, msg: 'Product not found or product out of stock!' });
		}
		const order_details = {
			"product_id": product_id,
			"user_id": user_id,
			"vendor_id": product_detail.vendor_id,
			quantity: quantity,
			price: product_detail.sell_price * quantity,
			address: address
		}
		const addOrderDetails = await Order.create(order_details);
		if (addOrderDetails != null) {
			const paymentDetails = await Payment.create({
				orders: [addOrderDetails._id],
				date: new Date(),
				total_price: addOrderDetails.price,
				vendors: [{
					vendor: addOrderDetails.vendor_id,
					amount: addOrderDetails.price,
					order: addOrderDetails._id
				}],
				user_id: user_id
			})
			res.status(200).send({ status: true, msg: 'product has been moved to orders', data: order_details, payment: paymentDetails });
		}
		else {
			res.status(200).send({ status: false, msg: 'product could not be moved to orders' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.cartToOrder = async (req, res, next) => {
	try {
		const {
			user_id, cart_id, address
		} = req.body
		if (!user_id || !cart_id) {
			return res.status(400).send({ status: false, msg: 'Please provide user_id & cart_id ' });
		}
		let cart_detail = await Cart.aggregate(
			[
				{
					$match: {
						_id: new mongoose.Types.ObjectId(cart_id)
					}
				},
				{ $unwind: "$products" },
				{
					$lookup:
					{
						from: 'products',
						let: { productId: "$products.product_id", qty: "$products.quantity" },
						pipeline: [
							{
								$match: {
									$and: [
										{
											$expr: {
												$eq: ["$$productId", "$_id"],
											}
										},
										{
											$expr: {
												$gte: ["$stock", "$$qty"]
											}
										}
									]
								}
							},
							{
								$addFields: {
									quantity: "$$qty"
								}
							}
						],
						as: "product_details",
					},
				},
				{ $unwind: "$product_details" },
				{
					$project: {
						product_details: 1
					}
				}
			]
		);
		// return res.json(cart_detail)
		if (cart_detail != null && cart_detail.length) {
			await Promise.all(
				cart_detail.map(async (prod) => {
					const price = prod.product_details.sell_price
					const qty = prod.product_details.quantity
					const order_details = {
						"product_id": prod.product_details._id,
						"user_id": user_id,
						"vendor_id": prod.product_details.vendor_id,
						quantity: qty,
						price: price * qty,
						address: address
					}
					return await Order.create(order_details);
				})
			)
				.then(ord => {
					if (ord) {
						// await Promise.resolve(Cart.findByIdAndUpdate(cart_id, { products: [] }))
						return ord
					}
				})
				.then(async (ord) => {
					if (ord) {
						const total_price = ord.reduce((prev, cur) => prev + cur.price, 0)
						const orderId = ord.map(o => o._id)
						const vendors = ord.map(o => {
							return {
								vendor: o.vendor_id,
								amount: o.price,
								order: o._id
							}
						})
						const payment = await Payment.create({
							orders: orderId,
							date: new Date(),
							total_price: total_price,
							vendors: vendors,
							user_id: user_id,
						})
						await Cart.findByIdAndUpdate(cart_id, { products: [] })
						return res.status(200).send({ status: true, msg: 'Cart moved to the order', data: ord, payment_id: payment });
					}

				})
				.catch(er => {
					throw er
				})
		}
		else {
			return res.status(400).send({ status: false, msg: 'Cart not found or cart is empty !' });
		}

	}
	catch (er) {
		next(er)
	}
};
module.exports.cancelOrder = async (req, res, next) => {
	try {
		const {
			cancel_reason, id
		} = req.body
		if (!cancel_reason || !id) {
			return res.status(400).send({ status: false, msg: 'Please provide user_id & id & cancel_reason' });
		}

		const cancelOrder = await Order.findOneAndUpdate({ _id: id }, { status: "cancelled", reasonForCancel: cancel_reason });
		if (cancelOrder != null) {
			return res.status(200).send({ status: true, msg: 'Order cancelled', });
		}
		else {
			return res.status(200).send({ status: false, msg: 'Order cancelled could not be cancelled' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.shipOrder = async (req, res, next) => {
	try {
		const {
			shipmentCompany, consignmentNo, id
		} = req.body
		if (!shipmentCompany || !consignmentNo || !id) {
			return res.status(400).send({ status: false, msg: 'Please provide shipmentCompany,consignmentNo, id' });
		}

		const shipOrder = await Order.findOneAndUpdate({ _id: id }, { status: "shipped", shipmentCompany, consignmentNo });
		if (shipOrder != null) {
			return res.status(200).send({ status: true, msg: 'Order shipped', });
		}
		else {
			return res.status(200).send({ status: false, msg: 'Order shipped could not be cancelled' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.changeStatus = async (req, res, next) => {
	try {
		const {
			status, id
		} = req.body
		if (!status || !id) {
			return res.status(400).send({ status: false, msg: 'Please provide status & id ' });
		}

		const updateOrder = await Order.findOneAndUpdate({ _id: id }, { status: status });
		if (updateOrder != null) {
			return res.status(200).send({ status: true, msg: 'Order status changed', });
		}
		else {
			return res.status(200).send({ status: false, msg: 'Order status could not be changed' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.getById = async (req, res, next) => {
	try {
		const id = req.params.id
		if (!id) {
			return res.status(400).send({ status: false, msg: 'Please provide order id' });
		}
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						_id: mongoose.Types.ObjectId(id),
					}
				},
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
				{ $unwind: "$product_details" },
				{
					$lookup:
					{
						from: 'vendors',
						localField: "vendor_id",
						foreignField: "_id",
						as: "vendor_details",
					},
				},
				{
					$project: {
						"product_details.stock": 0,
						"product_details.sold": 0,
						"product_details.rateValue": 0,
						"product_details.createdAt": 0,
						"product_details.updatedAt": 0,

						"vendor_details.user_id": 0,
						"vendor_details.email": 0,
						"vendor_details.phone": 0,
						"vendor_details.status": 0,
						"vendor_details.createdAt": 0,
						"vendor_details.updatedAt": 0,

					}
				}
			]);

		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}

module.exports.allOrderByUser = async (req, res, next) => {
	try {
		const user_id = req.params.user_id
		if (!user_id) {
			return res.status(400).send({ status: false, msg: 'Please provide user_id ' });
		}
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;

		const order_details = await Order.aggregate(
			[
				{
					$match: {
						user_id: mongoose.Types.ObjectId(user_id),
					}
				},
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
				{
					$lookup:
					{
						from: 'vendors',
						localField: "vendor_id",
						foreignField: "_id",
						as: "vendor_details",
					},
				},
				{
					$project: {
						"product_details.stock": 0,
						"product_details.sold": 0,
						"product_details.rateValue": 0,
						"product_details.createdAt": 0,
						"product_details.updatedAt": 0,

						"vendor_details.user_id": 0,
						"vendor_details.email": 0,
						"vendor_details.phone": 0,
						"vendor_details.status": 0,
						"vendor_details.createdAt": 0,
						"vendor_details.updatedAt": 0,

					}
				}
			]);
		const totalOrder = await Order.countDocuments({ user_id: user_id })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details, totalOrder: totalOrder });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}

module.exports.allOrderByVendor = async (req, res, next) => {
	try {
		const vendor_id = req.params.vendor_id
		if (!vendor_id) {
			return res.status(400).send({ status: false, msg: 'Please provide vendor_id ' });
		}
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						vendor_id: mongoose.Types.ObjectId(vendor_id),
					}
				},
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
			]);

		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allOrderByProduct = async (req, res, next) => {
	try {
		const vendor_id = req.params.vendor_id
		const product_id = req.query.product_id
		if (!product_id) {
			return res.status(400).send({ status: false, msg: 'Please provide product_id ' });
		}
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						product_id: mongoose.Types.ObjectId(product_id),
						vendor_id: mongoose.Types.ObjectId(vendor_id),
					}
				},
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
			]);

		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}

module.exports.allLatestOrder = async (req, res, next) => {
	try {
		const vendor_id = req.params.vendor_id

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						vendor_id: mongoose.Types.ObjectId(vendor_id),
					}
				},
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
				{ $unwind: "$product_details" },

				{
					$lookup:
					{
						from: 'users',
						localField: "user_id",
						foreignField: "_id",
						as: "user_details",
					},
				},
				{
					$project: {
						'user_details.email': 0,
						'user_details.phone': 0,
						'user_details.password': 0,
						'user_details.isVerified': 0,
						'user_details.role': 0,
						'user_details.accessToken': 0,
						'user_details.createdAt': 0,
						'user_details.updatedAt': 0,
					}
				},

				{ $unwind: "$user_details" }
			]);
		const count = await Order.countDocuments({ vendor_id: vendor_id })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details, totalOrder: count });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}

module.exports.allPendingOrder = async (req, res, next) => {
	try {
		const vendor_id = req.params.vendor_id

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						vendor_id: mongoose.Types.ObjectId(vendor_id),
						status: "pending",
					}
				},
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
				{ $unwind: "$product_details" },

				{
					$lookup:
					{
						from: 'users',
						localField: "user_id",
						foreignField: "_id",
						as: "user_details",
					},
				},
				{
					$project: {
						'user_details.email': 0,
						'user_details.phone': 0,
						'user_details.password': 0,
						'user_details.isVerified': 0,
						'user_details.role': 0,
						'user_details.accessToken': 0,
						'user_details.createdAt': 0,
						'user_details.updatedAt': 0,
					}
				},

				{ $unwind: "$user_details" }
			]);
		const count = await Order.countDocuments({ vendor_id: vendor_id, status: "pending" })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details, totalOrder: count });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allApprovedOrder = async (req, res, next) => {
	try {
		const vendor_id = req.params.vendor_id

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						vendor_id: mongoose.Types.ObjectId(vendor_id),
						status: "approved",
					}
				},
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
				{ $unwind: "$product_details" },

				{
					$lookup:
					{
						from: 'users',
						localField: "user_id",
						foreignField: "_id",
						as: "user_details",
					},
				},
				{
					$project: {
						'user_details.email': 0,
						'user_details.phone': 0,
						'user_details.password': 0,
						'user_details.isVerified': 0,
						'user_details.role': 0,
						'user_details.accessToken': 0,
						'user_details.createdAt': 0,
						'user_details.updatedAt': 0,
					}
				},

				{ $unwind: "$user_details" }
			]);
		const count = await Order.countDocuments({ vendor_id: vendor_id, status: "approved", })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details, totalOrder: count });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allShippedOrder = async (req, res, next) => {
	try {
		const vendor_id = req.params.vendor_id

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						vendor_id: mongoose.Types.ObjectId(vendor_id),
						status: "shipped",
					}
				},
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
				{ $unwind: "$product_details" },

				{
					$lookup:
					{
						from: 'users',
						localField: "user_id",
						foreignField: "_id",
						as: "user_details",
					},
				},
				{
					$project: {
						'user_details.email': 0,
						'user_details.phone': 0,
						'user_details.password': 0,
						'user_details.isVerified': 0,
						'user_details.role': 0,
						'user_details.accessToken': 0,
						'user_details.createdAt': 0,
						'user_details.updatedAt': 0,
					}
				},

				{ $unwind: "$user_details" }
			]);
		const count = await Order.countDocuments({ vendor_id: vendor_id, status: "shipped", })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details, totalOrder: count });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}

module.exports.allCancelledOrder = async (req, res, next) => {
	try {
		const vendor_id = req.params.vendor_id

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						vendor_id: mongoose.Types.ObjectId(vendor_id),
						status: "cancelled",
					}
				},
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
				{ $unwind: "$product_details" },

				{
					$lookup:
					{
						from: 'users',
						localField: "user_id",
						foreignField: "_id",
						as: "user_details",
					},
				},
				{
					$project: {
						'user_details.email': 0,
						'user_details.phone': 0,
						'user_details.password': 0,
						'user_details.isVerified': 0,
						'user_details.role': 0,
						'user_details.accessToken': 0,
						'user_details.createdAt': 0,
						'user_details.updatedAt': 0,
					}
				},

				{ $unwind: "$user_details" }
			]);
		const count = await Order.countDocuments({ vendor_id: vendor_id, status: "cancelled" })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details, totalOrder: count });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allDeliveredOrder = async (req, res, next) => {
	try {
		const vendor_id = req.params.vendor_id

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						vendor_id: mongoose.Types.ObjectId(vendor_id),
						status: "delivered",
					}
				},
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
			]);

		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allOrderCount = async (req, res, next) => {
	try {
		const order_details = await Order.countDocuments({})
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'All Order count', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allDeliveredOrderCount = async (req, res, next) => {
	try {
		const order_details = await Order.countDocuments({ status: "delivered" })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Delivered order count', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allPendingCount = async (req, res, next) => {
	try {
		const order_details = await Order.countDocuments({ status: "pending" })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'pending order count', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allShippedCount = async (req, res, next) => {
	try {
		const order_details = await Order.countDocuments({ status: "shipped" })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'shipped order count', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allNewCount = async (req, res, next) => {
	try {
		const date = new Date()
		const order_details = await Order.countDocuments({ status: "pending", })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'shipped order count', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.allCancelledOrderCount = async (req, res, next) => {
	try {
		const order_details = await Order.countDocuments({ status: "cancelled" })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Cancelled order count', data: order_details });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}

module.exports.allShippedOrderAdmin = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 20;
		const skip = page ? (page - 1) * limit : 0;
		const order_details = await Order.aggregate(
			[
				{
					$match: {
						status: "shipped",
					}
				},
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: limit },
				{
					$lookup:
					{
						from: 'products',
						localField: "product_id",
						foreignField: "_id",
						as: "product_details",
					},
				},
				{ $unwind: "$product_details" },
				{
					$lookup:
					{
						from: 'vendors',
						localField: "vendor_id",
						foreignField: "_id",
						as: "vendor_details",
					},
				},
				{ $unwind: "$vendor_details" },

				{
					$lookup:
					{
						from: 'users',
						localField: "user_id",
						foreignField: "_id",
						as: "user_details",
					},
				},
				{
					$project: {
						'user_details.email': 0,
						'user_details.phone': 0,
						'user_details.password': 0,
						'user_details.isVerified': 0,
						'user_details.role': 0,
						'user_details.accessToken': 0,
						'user_details.createdAt': 0,
						'user_details.updatedAt': 0,
					}
				},

				{ $unwind: "$user_details" }
			]);
		const count = await Order.countDocuments({  status: "shipped" })
		if (order_details != null) {
			return res.status(200).send({ status: true, msg: 'Order found', data: order_details, totalOrder: count });
		}
		else {
			return res.status(400).send({ status: false, msg: 'Order could not be found' });
		}
	}
	catch (er) {
		next(er)
	}
}