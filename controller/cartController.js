const Cart = require("../models/Cart")
const WishList = require("../models/wishlist")
const Product = require("../models/Product")
const mongoose = require('mongoose')

module.exports.addToCart = async (req, res, next) => {
    try {
        const userId = req.body.user_id
        const productId = req.body.product_id
        const qty = req.body.quantity || 1
        if (!userId || !productId) {
            return res.status(400).json({ status: false, msg: "user_id or product_id  not found" })
        }

        const alReadyExist = await Cart.findOne({ "products.product_id": productId });
        if (alReadyExist != null) {
            return res.status(400).send({ status: false, msg: 'Product already in cart. Please add quantity instead', });
        }
        const productDetail = await Product.findOne({ _id: productId })
        if (productDetail && productDetail.stock < qty) {
            return res.status(200).send({ status: false, msg: 'Product out of stock. Please try again' });
        }
        if (productDetail != null) {
            const addingToCart = await Cart.findOneAndUpdate(
                { user_id: userId },
                {
                    $push: {
                        products: {
                            product_id: productId,
                            vendor_id: productDetail.vendor_id,
                            quantity: qty,
                        }
                    },
                },
                {
                    new: true,
                    upsert: true,
                    rawResult: true
                }
            );
            if (addingToCart != null) {
                return res.status(200).send({ status: true, msg: 'Cart has been updated', data: addingToCart.value });
            }
            else {
                res.status(400).send({ status: false, msg: 'Product could not be added to cart' });
            }
        }
        else {
            res.status(400).send({ status: false, msg: 'Product not found' });
        }
    }
    catch (er) {
        next(er)
    }
}
module.exports.wishListToCart = async (req, res, next) => {
    try {
        const userId = req.body.user_id
        const wishListId = req.body.wishlist_id
        if (!userId || !wishListId) {
            return res.status(400).json({ status: false, msg: "user_id or product_id  not found" })
        }
        const existWishList = await WishList.findById(wishListId)
        console.log(existWishList )
        if (existWishList == null || existWishList.products.length < 1) {
            return res.status(400).send({ status: false, msg: 'Wish list not found', });
        }
        await Promise.all(existWishList.products.map( async (prod) => {
            const alReadyExist = await Cart.findOne({ "products.product_id": prod });
            if (alReadyExist != null) {
                return null
            }
            const productDetail = await Product.findOne({ _id: prod })
            if (productDetail && productDetail.stock < 1) {
                return null
            }
            if (productDetail != null) {
                await Cart.findOneAndUpdate(
                    { user_id: userId },
                    {
                        $push: {
                            products: {
                                product_id: prod,
                                vendor_id: productDetail.vendor_id,
                                quantity: 1,
                            }
                        },
                    },
                );
                return prod
            }
        }))
            .then(async(resp) => {
                console.log(resp)
                await WishList.findByIdAndUpdate(wishListId,{products:[]})
                return res.json({status:true,msg:'Product moved to the carts'})
            })
    }
    catch (er) {
        next(er)
    }
}
//edit cart details
module.exports.changeQty = async (req, res) => {
    try {
        const { product_id, user_id, quantity } = req.body;
        if (!product_id || !user_id || quantity == undefined) {
            return res.status(400).send({ status: false, msg: 'Please provide product_id & user_id, quantity', });
        }
        if (quantity < 1) {
            const removeProduct = await Cart.findOneAndUpdate(
                {
                    user_id: user_id,
                    "products.product_id": product_id
                },
                {
                    $pull: {
                        products: {
                            product_id: product_id
                        }
                    }
                },
                {
                    new: true,
                }
            );
            if (removeProduct != null) {
                res.status(200).send({ status: true, msg: 'Product removed from cart', });
            }
            else {
                res.status(200).send({ status: false, msg: 'Product can not be remove from cart. Something went wrong' });
            }
        }
        const productDetail = await Product.findOne({ _id: product_id })
        if (productDetail && productDetail.stock < quantity) {
            return res.status(200).send({ status: false, msg: 'Product out of stock. Please try again' });
        }
        const cartDetail = await Cart.findOne({ user_id: user_id })
        const productInCart = cartDetail.products.find(e => e.product_id == product_id)
        if (!productInCart) {
            return res.status(400).send({ status: true, msg: 'Product not found in cart', });
        }
        const changeQty = await Cart.findOneAndUpdate(
            { user_id: user_id, "products.product_id": product_id },
            {
                $set: {
                    'products.$.quantity': quantity,
                },
            },
            {
                new: true,
            }
        );
        if (changeQty) {
            res.status(200).send({ status: true, data: changeQty, msg: 'Quantity changed of the product' });
        }
        else {
            res.status(200).send({ status: false, msg: 'cart details could not be updated' });
        }
    }
    catch (er) {
        next(er)
    }
};
module.exports.removeProductFromCart = async (req, res, next) => {
    try {
        const { product_id, user_id } = req.body;
        if (!product_id || !user_id) {
            return res.status(400).send({ status: false, msg: 'Please provide product_id & user_id', });
        }
        const removeProduct = await Cart.findOneAndUpdate(
            {
                user_id: user_id,
                "products.product_id": product_id
            },
            {
                $pull: {
                    products: {
                        product_id: product_id
                    }
                }
            },
            {
                new: true
            }
        );
        if (removeProduct) {
            res.status(200).send({ status: true, msg: 'Product remove from cart', data: removeProduct });
        }
        else {
            res.status(200).send({ status: false, msg: 'Product can not be remove from cart. Something went wrong' });
        }
    }
    catch (er) {
        next(er)
    }
};
//view cart 
module.exports.viewCart = async (req, res, next) => {
    try {
        const userId = req.params.user_id
        if (!userId) {
            return res.status(200).send({ status: false, msg: 'Please provide user_id' });
        }
        let cartDetails = await Cart.aggregate(
            [
                { $match: { user_id: mongoose.Types.ObjectId(userId) } },
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
                                    ]
                                }
                            },
                            {

                                $addFields: {
                                    totalPrice: {
                                        $multiply: ["$$qty", "$sell_price"]
                                    }
                                }
                            }
                        ],
                        as: "product_details",
                    },
                },
                {
                    $lookup:
                    {
                        from: 'vendors',
                        localField: "products.vendor_id",
                        foreignField: "_id",
                        as: "vendor_details"
                    }
                },
                { $unwind: "$product_details" },
                { $unwind: "$vendor_details" },
                {
                    $addFields: {
                        outOfStock: {
                            $cond: { if: { $lt: ["$product_details.stock", "$products.quantity"] }, then: true, else: false }
                        }
                    }
                },
                {
                    $project: {
                        products: 1,
                        outOfStock: 1,
                        'vendor_details._id': 1,
                        'vendor_details.company_name': 1,
                        'vendor_details.name': 1,
                        'product_details._id': 1,
                        'product_details.name': 1,
                        'product_details.totalPrice': 1,
                        'product_details.totalTax': 1,
                        'product_details.vendor_id': 1,
                        'product_details.sell_price': 1,
                        'product_details.price_off': 1,
                        'product_details.stock': 1,
                        'product_details.price': 1,
                        'product_details.rating': 1,
                        'product_details.rateCount': 1,
                        'product_details.images': 1,
                    }
                },
                {
                    $group: {
                        "_id": "$_id",
                        "allCart": {
                            $push: "$$ROOT"
                        },

                        grandTotalPrice: {
                            $sum: {
                                $cond: [
                                    "$outOfStock",
                                    0,
                                    "$product_details.totalPrice",
                                ],
                            }
                        },
                    }
                },
                {
                    $project: {
                        'allCart.product_details.stock': 0,
                        "cartDetails.product_details.stock": 0
                    }
                }
            ]);
        if (cartDetails != null) {
            res.status(200).send({ status: true, data: cartDetails, msg: 'User cart details found ' });
        } else {
            res.status(400).send({ status: false, msg: 'User cart details not found ' });
        }
    }
    catch (er) {
        next(er)
    }
};

