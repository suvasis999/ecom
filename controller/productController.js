const Product = require("../models/Product")
const Validation = require("../config/validation")
const server_url = process.env.SERVER_URL
const mongoose = require("mongoose")


module.exports.createProduct = async (req, res, next) => {
	try {
		const {
			vendor_id, name, price, category, price_off, colors, size, stock, product_details
		} = req.body
		const validating = Validation.validate([
			{ vendor_id }, { name }, { price }, { category }, { stock }
		])
		if (!validating.isValid) {
			return res.status(400).json({ msg: validating.validationError, status: false })
		}
		const newProduct = new Product({
			vendor_id, name, price, category, price_off, colors, size, stock, product_details,
		})
		await newProduct.save()
		if (newProduct != null) {
			return res.status(200).json({ status: true, msg: `New product added.`, data: newProduct })
		}
		else {
			return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.editProduct = async (req, res, next) => {
	try {
		const id = req.params.id
		const {
			vendor_id, name, price, category, price_off, colors, size, stock, sold, product_details
		} = req.body
		const updateDate = Validation.updateData([
			{vendor_id}, {name}, {price}, {category}, {price_off}, {colors}, {size}, {stock}, {sold}, {product_details},
		])
		// console.log("updateDate=======",updateDate)
		const existProduct = await Product.findById(id)
		if (existProduct == null) {
			return res.status(400).json({ status: true, msg: "Product not found", })
		}
		for (let k in updateDate) {
			existProduct[k] = req.body[k]
		}
		//NOTE: always use save so pre save will work
		await existProduct.save()

		if (existProduct != null) {
			return res.status(200).json({ status: true, msg: "Product updated", data: existProduct })
		}
		else {
			return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.changeStock = async (req, res, next) => {
	try {
		const id = req.params.id
		const {
			vendor_id, stock
		} = req.body

		if (!id || !vendor_id || !stock) {
			return res.status(400).json({ status: false, msg: "All fields are required" })
		}
		const existProduct = await Product.findOne({ _id: id, vendor_id: vendor_id })
		if (existProduct == null) {
			return res.status(400).json({ status: false, msg: "Product not found", })
		}
		existProduct.stock = stock
		//NOTE: always use save so pre save will work
		await existProduct.save()
		if (existProduct != null) {
			return res.status(200).json({ status: true, msg: "Product stock updated", data: existProduct })
		}
		else {
			return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.addPicture = async (req, res, next) => {
	try {
		const id = req.params.id
		if (!id) {
			return res.status(400).json({ status: false, msg: "id not found" })
		}
		const files = req.files
		if (!files) {
			return res.status(400).json({ status: false, msg: "Image not found" })
		}
		const allImage = req.files.map(pic => {
			return server_url + pic.path
		})
		Product.findByIdAndUpdate(id, { $set: { images: allImage } }, (er) => {
			if (!er) {
				return res.status(200).json({ status: true, msg: `Product pictures uploaded successfully.` })
			}
			else {
				return res.status(400).json({ status: false, msg: "Something went wrong. Please try again later" })
			}
		})
	}
	catch (er) {
		next(er)
	}
}

module.exports.deleteProduct = async (req, res, next) => {
	try {
		const id = req.params.id

		await Product.findByIdAndDelete(id)
		return res.status(200).json({ status: true, msg: "Product deleted" })

	}
	catch (er) {
		next(er)
	}
}
module.exports.getByIdVendor = async (req, res, next) => {
	try {
		const id = req.params.id
		const vendor_id = req.query.vendor_id
		const productDetails = await Product.aggregate(
			[
				{
					$match: {
						_id: mongoose.Types.ObjectId(id),
						vendor_id: mongoose.Types.ObjectId(vendor_id),
					}
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
					$lookup:
					{
						from: 'categories',
						localField: "category",
						foreignField: "_id",
						as: "category_details",
					},
				},
			]
		)
		if (productDetails != null) {
			return res.status(200).json({ status: true, msg: "Product by product_id  founds", data: productDetails })
		}
		else {
			return res.status(400).json({ status: false, msg: "Product by product_id  not founds" })
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.getAllForVendor = async (req, res, next) => {
	try {
		const vendor_id = req.params.vendor_id
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 15;
		const skip = page ? (page - 1) * limit : 0;
		const productDetails = await Product.aggregate(
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
						from: 'vendors',
						localField: "vendor_id",
						foreignField: "_id",
						as: "vendor_details",
					},
				},
				{
					$lookup:
					{
						from: 'categories',
						localField: "category",
						foreignField: "_id",
						as: "category_details",
					},
				},
			]
		)
		if (productDetails && productDetails.length) {
			return res.status(200).json({ status: true, msg: "All Product by vendor  founds", data: productDetails })
		}
		else {
			return res.status(400).json({ status: false, msg: "All Product by vendor  not founds" })
		}
	}
	catch (er) {
		next(er)
	}
}



//**********FOR USERS */
module.exports.getById = async (req, res, next) => {
	try {
		const id = req.params.id
		const productDetails = await Product.aggregate(
			[
				{
					$match: {
						_id: mongoose.Types.ObjectId(id),
					}
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
				{$unwind:"$vendor_details"},
				{
					$lookup:
					{
						from: 'categories',
						localField: "category",
						foreignField: "_id",
						as: "category_details",
					},
				},
				{
					$project: {
						'vendor_details.email': 0,
						'vendor_details.phone': 0,
						'vendor_details.status': 0,
						'vendor_details.doc_1': 0,
						'vendor_details.doc_2': 0,
						'vendor_details.doc_3': 0,
					}
				}
			]
		)
		if (productDetails != null) {
			return res.status(200).json({ status: true, msg: "Product by product_id  founds", data: productDetails })
		}
		else {
			return res.status(400).json({ status: false, msg: "Product by product_id  not founds" })
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.availability = async (req, res, next) => {
	try {
		const id = req.params.id
		const qty = req.query.qty
		const productDetails = await Product.findOne({_id:id,stock:{$gte:qty}})
		if (productDetails != null) {
			return res.status(200).json({ status: true, msg: "Product is available",  })
		}
		else {
			return res.status(200).json({ status: false, msg: "Product out of stock" })
		}
	}
	catch (er) {
		next(er)
	}
}
module.exports.bestSeller = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 15;
		const skip = page ? (page - 1) * limit : 0;
		const productDetails = await Product.aggregate(
			[
				{
					$match: {
						stock: { $gt: 0 },
					}
				},
				{ $sort: { stock: -1 } },
				{ $skip: skip },
				{ $limit: limit },
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
					$lookup:
					{
						from: 'categories',
						localField: "category",
						foreignField: "_id",
						as: "category_details",
					},
				},
				{$unwind:"$vendor_details"},
				{$unwind:"$category_details"},
				{
					$project: {
						'vendor_details.user_id': 0,
						'vendor_details.email': 0,
						'vendor_details.phone': 0,
						'vendor_details.status': 0,
						'vendor_details.doc_1': 0,
						'vendor_details.doc_2': 0,
						'vendor_details.doc_3': 0,
					}
				}
			]
		)
		if (productDetails && productDetails.length) {
			return res.status(200).json({ status: true, msg: "Product founds", data: productDetails })
		}
		else {
			return res.status(400).json({ status: false, msg: "Product  not founds" })
		}
	}
	catch (er) {
		next(er)
	}
}


module.exports.popular = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 15;
		const skip = page ? (page - 1) * limit : 0;
		const productDetails = await Product.aggregate(
			[
				{
					$match: {
						stock: { $gt: 0 },
					}
				},
				{ $sort: { rateValue: -1 } },
				{ $skip: skip },
				{ $limit: limit },
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
					$lookup:
					{
						from: 'categories',
						localField: "category",
						foreignField: "_id",
						as: "category_details",
					},
				},
				{$unwind:"$vendor_details"},
				{$unwind:"$category_details"},
				{
					$project: {
						'vendor_details.user_id': 0,
						'vendor_details.email': 0,
						'vendor_details.phone': 0,
						'vendor_details.status': 0,
						'vendor_details.doc_1': 0,
						'vendor_details.doc_2': 0,
						'vendor_details.doc_3': 0,
					}
				}
			]
		)
		if (productDetails && productDetails.length) {
			return res.status(200).json({ status: true, msg: "Product   founds", data: productDetails })
		}
		else {
			return res.status(400).json({ status: false, msg: "Product   not founds" })
		}
	}
	catch (er) {
		next(er)
	}
}


module.exports.newProduct = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 15;
		const skip = page ? (page - 1) * limit : 0;
		const productDetails = await Product.aggregate(
			[
				{
					$match: {
						stock: { $gt: 0 },
					}
				},
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: limit },
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
					$lookup:
					{
						from: 'categories',
						localField: "category",
						foreignField: "_id",
						as: "category_details",
					},
				},
				{$unwind:"$vendor_details"},
				{$unwind:"$category_details"},
				{
					$project: {
						'vendor_details.user_id': 0,
						'vendor_details.email': 0,
						'vendor_details.phone': 0,
						'vendor_details.status': 0,
						'vendor_details.doc_1': 0,
						'vendor_details.doc_2': 0,
						'vendor_details.doc_3': 0,
					}
				}
			]
		)
		if (productDetails && productDetails.length) {
			return res.status(200).json({ status: true, msg: "Product   founds", data: productDetails })
		}
		else {
			return res.status(400).json({ status: false, msg: "Product   not founds" })
		}
	}
	catch (er) {
		next(er)
	}
}


module.exports.category = async (req, res, next) => {
	try {
		const category = req.params.category
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(process.env.PAGE_LIMIT) || 15;
		const skip = page ? (page - 1) * limit : 0;
		const productDetails = await Product.aggregate(
			[
				{
					$match: {
						stock: { $gt: 0 },
						category: mongoose.Types.ObjectId(category),
					}
				},
				{ $sort: { sold: -1 } },
				{ $skip: skip },
				{ $limit: limit },
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
					$lookup:
					{
						from: 'categories',
						localField: "category",
						foreignField: "_id",
						as: "category_details",
					},
				},
				{$unwind:"$vendor_details"},
				{$unwind:"$category_details"},
				{
					$project: {
						'vendor_details.user_id': 0,
						'vendor_details.email': 0,
						'vendor_details.phone': 0,
						'vendor_details.status': 0,
						'vendor_details.doc_1': 0,
						'vendor_details.doc_2': 0,
						'vendor_details.doc_3': 0,
					}
				}
			]
		)
		if (productDetails && productDetails.length) {
			return res.status(200).json({ status: true, msg: "Product   founds", data: productDetails })
		}
		else {
			return res.status(400).json({ status: false, msg: "Product   not founds" })
		}
	}
	catch (er) {
		next(er)
	}
}

