const Review = require("../models/review");
const Product = require("../models/Product");
const Vendor = require("../models/vendor");
const mongoose = require("mongoose");

module.exports.addReview = async (req, res, next) => {
  try {
    const { description, rating, product_id, vendor_id, user_id, feedback } =
      req.body;

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
        feedback,
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
      if (feedback) {
        await Vendor.findByIdAndUpdate(vendor_id, {
          $inc: {
            total_feedback: 1,
            positive_feedback: feedback === "positive" ? 1 : 0,
          },
        });
        await Vendor.updateOne({ _id: vendor_id }, [
          {
            $set: {
              average_positive_feedback: {
                $round: [
                  {
                    $divide: [
                      { $multiply: ["$positive_feedback", 100] },
                      "$total_feedback",
                    ],
                  },
                  2,
                ],
              },
            },
          },
        ]);
      }
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
    const viewreview = await Review.aggregate([
      {
        $match: {
          product_id: new mongoose.Types.ObjectId(product_id),
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
      {
        $group: {
          _id: null,
          five_star: {
            $sum: {
              $cond: [{ $eq: ["$rating", 5] }, 1, 0],
            },
          },
          four_star: {
            $sum: {
              $cond: [{ $eq: ["$rating", 4] }, 1, 0],
            },
          },
          three_star: {
            $sum: {
              $cond: [{ $eq: ["$rating", 3] }, 1, 0],
            },
          },
          two_star: {
            $sum: {
              $cond: [{ $eq: ["$rating", 2] }, 1, 0],
            },
          },
          one_star: {
            $sum: {
              $cond: [{ $eq: ["$rating", 1] }, 1, 0],
            },
          },
          productDetails: { $first: "$product_details" },
        },
      },
    ]);
    if (viewreview.length > 0) {
      res.status(200).send({
        status: true,
        data: viewreview,
        msg: "Product review details found",
      });
    } else {
      res
        .status(200)
        .send({ status: false, msg: "Product review  not  found" });
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
                userName: 1,
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

module.exports.customVendorFeedback = async (req, res, next) => {
  try {
    const { vendor_id, positive_feedback, total_feedback } = req.body;
    if (!vendor_id || !positive_feedback || !total_feedback) {
      return res
        .status(400)
        .send({ status: false, msg: "Please fill all the field" });
    }
    if (feedback) {
      await Vendor.findByIdAndUpdate(vendor_id, {
        $inc: {
          total_feedback: Number(total_feedback),
          positive_feedback: Number(positive_feedback),
        },
      });
      await Vendor.updateOne({ _id: vendor_id }, [
        {
          $set: {
            average_positive_feedback: {
              $round: [
                {
                  $divide: [
                    { $multiply: ["$positive_feedback", 100] },
                    "$total_feedback",
                  ],
                },
                2,
              ],
            },
          },
        },
      ]);
    }
    res.status(200).send({
      status: true,
      msg: "Feedback submitted. ",
    });
  } catch (er) {
    next(er);
  }
};

module.exports.customProductFeedback = async (req, res, next) => {
  try {
    const { product_id, total_rating, rating } = req.body;
    if (!product_id || !total_rating || !rating) {
      return res
        .status(400)
        .send({ status: false, msg: "Please fill all the field" });
    }
    await Product.updateOne(
      { _id: product_id },
      {
        $inc: { rateCount: total_rating, rateValue: total_rating * rating },
      }
    );
    await Product.updateOne({ _id: product_id }, [
      {
        $set: {
          rating: { $round: [{ $divide: ["$rateValue", "$rateCount"] }, 1] },
        },
      },
    ]);
    res.status(200).send({
      status: true,
      msg: "Reviews submitted. ",
    });
  } catch (er) {
    next(er);
  }
};
