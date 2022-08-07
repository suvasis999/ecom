const Review = require("../models/review");
const Product = require("../models/Product");
const Vendor = require("../models/vendor");
const mongoose = require("mongoose");
const vendorOverAllReview = async (vendor_id) => {
  if (!vendor_id) return null;
  const allReview = await Product.aggregate([
    {
      $match: {
        vendor_id: mongoose.Types.ObjectId(vendor_id),
      },
    },
    {
      $group: {
        _id: "null",
        avgRating: { $avg: "$rating" },
        totalRating: {
          $sum: "$rateCount",
        },
      },
    },
  ]);
  const avgRatings = Number.parseFloat(
    (100 * allReview[0].avgRating) / 5
  ).toFixed(2);
  await Vendor.findByIdAndUpdate(vendor_id, {
    average_rating: avgRatings,
    total_rating: allReview[0].totalRating,
  });
};
module.exports.addReview = async (req, res, next) => {
  try {
    const { description, rating, product_id, vendor_id, user_id } = req.body;

    const ratedBefore = await Review.countDocuments({
      user_id: user_id,
      product_id: product_id,
    });
    if (!ratedBefore) {
      const NewReview = await Review.create({
        description,
        rating,
        product_id,
        vendor_id,
        user_id,
      });
      await Product.updateOne(
        { _id: product_id },
        {
          $inc: { rateCount: 1, rateValue: rating },
        }
      );
      await Product.updateOne({ _id: product_id }, [
        {
          $set: {
            rating: { $round: [{ $divide: ["$rateValue", "$rateCount"] }, 1] },
          },
        },
      ]);
      vendorOverAllReview(vendor_id);
      if (NewReview != null) {
        res.status(200).send({
          status: true,
          data: NewReview,
          msg: "Product review has been added",
        });
      } else {
        res
          .status(200)
          .send({ status: false, msg: "Product review could not be added" });
      }
    } else {
      // const getReview = await Review.findOne({ user_id, product_id })

      // await Review.findOneAndUpdate({ user_id, product_id }, { description, rating })
      // const updateRating = rating - getReview.rating
      // await Product.updateOne({ _id: getReview.product_id },
      //     {
      //         $inc: { 'rateValue': updateRating },
      //     }
      // )
      // await Product.updateOne({ _id: getReview.product_id },
      //     [{ $set: { "rating": { $round: [{ $divide: ["$rateValue", "$rateCount"] }, 1] } } }]
      // )
      // vendorOverAllReview(vendor_id)
      res.status(200).send({
        status: false,
        msg: "Feedback already submitted for this order.",
      });
    }
  } catch (er) {
    next(er);
  }
};

module.exports.editReview = async (req, res, next) => {
  try {
    const { description, rating, review_id, vendor_id } = req.body;
    if (!description || !rating || !review_id) {
      return res
        .status(400)
        .send({ status: false, msg: "Please fill all the field" });
    }
    const getReview = await Review.findById(review_id);
    if (getReview != null) {
      await Review.findByIdAndUpdate(review_id, { description, rating });
      const updateRating = rating - getReview.rating;
      await Product.updateOne(
        { _id: getReview.product_id },
        {
          $inc: { rateValue: updateRating },
        }
      );
      await Product.updateOne({ _id: getReview.product_id }, [
        {
          $set: {
            rating: { $round: [{ $divide: ["$rateValue", "$rateCount"] }, 1] },
          },
        },
      ]);
      vendorOverAllReview(vendor_id);
    }
    if (getReview != null) {
      res.status(200).send({ status: true, msg: "Product review edited" });
    } else {
      res
        .status(200)
        .send({ status: false, msg: "Product review could not be edited" });
    }
  } catch (er) {
    next(er);
  }
};
module.exports.viewReview = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const skip = page ? (page - 1) * limit : 0;
    const product_id = req.params.product_id;
    if (!product_id) {
      return res
        .status(400)
        .send({ status: false, msg: "Product_id  not found" });
    }
    const star = req.query.star;
    let match = {
      product_id: new mongoose.Types.ObjectId(product_id),
      isBlocked: false,
    };
    if (star && [1, 2, 3, 4, 5].includes(Number(star))) {
      match.rating = Number(star);
    }
    const viewreview = await Review.aggregate([
      {
        $match: { match },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          let: { productId: "$product_id" },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ["$$productId", "$_id"],
                    },
                  },
                ],
              },
            },
          ],
          as: "product_details",
        },
      },
    ]);
    if (viewreview != null) {
      res.status(200).send({
        status: true,
        data: viewreview,
        msg: "Product review details found",
      });
    } else {
      res
        .status(200)
        .send({ status: false, msg: "Product review could not be found" });
    }
  } catch (er) {
    next(er);
  }
};

module.exports.viewReviewByUser = async (req, res, next) => {
  try {
    const user_id = req.params.user_id;
    if (!user_id) {
      return res.status(400).send({ status: false, msg: "user_id  not found" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const skip = page ? (page - 1) * limit : 0;
    // const viewreview = await Review.find({ user_id: user_id }).skip(skip).limit(limit)
    const viewreview = await Review.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(user_id),
          isBlocked: false,
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "products",
          let: { productId: "$product_id" },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ["$$productId", "$_id"],
                    },
                  },
                ],
              },
            },
          ],
          as: "product_details",
        },
      },
    ]);
    if (viewreview != null) {
      res.status(200).send({
        status: true,
        data: viewreview,
        msg: "product review details found",
      });
    } else {
      res
        .status(200)
        .send({ status: false, msg: "product review could not be found" });
    }
  } catch (er) {
    next(er);
  }
};

module.exports.Reviewlist = async (req, res, next) => {
  try {
    if (!req.params.product_id) {
      return res
        .status(400)
        .send({ status: false, msg: "product_id  not found" });
    }
    const page = parseInt(req.query.page) || 1;
    const limit = 30;
    const skip = page ? (page - 1) * limit : 0;
    const star = req.query.star;
    let match = {
      product_id: new mongoose.Types.ObjectId(req.params.product_id),
      isBlocked: false,
    };
    if (star && [1, 2, 3, 4, 5].includes(Number(star))) {
      match.rating = Number(star);
    }
    const productdetailsList = await Review.aggregate([
      {
        $match: match,
      },
      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: "users",
          let: { userId: "$user_id" },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ["$$userId", "$_id"],
                    },
                  },
                ],
              },
            },
            {
              $project: {
                firstname: 1,
                lastname: 1,
              },
            },
          ],
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $lookup: {
          from: "products",
          let: { productId: "$product_id" },
          pipeline: [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ["$$productId", "$_id"],
                    },
                  },
                ],
              },
            },
          ],
          as: "product_details",
        },
      },
      { $unwind: "$product_details" },
    ]);
    if (productdetailsList != null) {
      res.status(200).send({
        status: true,
        data: productdetailsList,
        msg: "product reviews list",
      });
    } else {
      res
        .status(200)
        .send({ status: false, msg: "product review list not found" });
    }
  } catch (er) {
    next(er);
  }
};
module.exports.blockReview = async (req, res, next) => {
  try {
    const { review_id } = req.body;
    if (!review_id) {
      return res
        .status(400)
        .send({ status: false, msg: "Please fill all the field" });
    }
    const getReview = await Review.findById(review_id);
    if (getReview != null) {
      await Review.findByIdAndUpdate(review_id, { isBlocked: true });
      await Product.updateOne(
        { _id: getReview.product_id },
        {
          $inc: { rateValue: -getReview.rating },
        }
      );
      await Product.updateOne({ _id: getReview.product_id }, [
        {
          $set: {
            rating: { $round: [{ $divide: ["$rateValue", "$rateCount"] }, 1] },
          },
        },
      ]);
      vendorOverAllReview(vendor_id);
    }
    if (getReview != null) {
      res.status(200).send({ status: true, msg: "Product review blocked" });
    } else {
      res.status(200).send({ status: false, msg: "Product review not found" });
    }
  } catch (er) {
    next(er);
  }
};
