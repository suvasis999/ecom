const Chat = require("../models/chat");
const User = require("../models/User");
const Order = require("../models/Order");
const mongoose = require("mongoose");
module.exports.sendMessage = async (req, res, next) => {
  try {
    const { from, to, msg } = req.body;
    if (!from || !to || !msg) {
      return res.status(400).json({
        status: false,
        msg: " 'from', 'to', and 'msg' fields are mandatory.",
      });
    }
    const existChat = await Chat.findOne({ members: [to, from] });
    if (existChat == null) {
      const newChat = await Chat.create({
        members: [from, to],
        message: [
          {
            from: from,
            time: new Date(),
            body: msg,
          },
        ],
      });
      return res.json({ data: newChat, status: true });
    } else {
      const updateChat = await Chat.findOneAndUpdate(
        { members: [from, to] },
        { $push: { message: msg } },
        { new: true }
      );
      return res.json({ data: updateChat, status: true });
    }
  } catch (er) {
    next(er);
  }
};

module.exports.AllChat = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ status: false, msg: " userId not found." });
    }
    const allChat = await Chat.aggregate([
      {
        $match: {
          members: {
            $elemMatch: { user: new mongoose.Types.ObjectId(userId) },
          },
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "members.user",
          as: "all_users",
        },
      },
      {
        "$addFields": {
          vendor_user: {
            "$filter": {
              "input": "$members",
              "as": "members",
              "cond": {
                $eq: [
                  "$$members.type",
                  "seller"
                ]
              }
            }
          }
        }
      },
      {$unwind:"$vendor_user"},
      {
        $lookup: {
          from: "vendors",
          foreignField: "user_id",
          localField: "vendor_user.user",
          as: "vendor",
        },
      },
     
      { $unwind: "$vendor" },
      {
        $lookup: {
          from: "products",
          foreignField: "_id",
          localField: "product",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: "$_id",
          lastMsg: { $last: "$message" },
          "all_users.firstname": 1,
          "all_users.lastname": 1,
          "all_users._id": 1,
          "all_users.role": 1,
          "all_users.userName": 1,
          members: 1,
          vendor: 1,
          product_id: "$productDetails._id",
          product_name: "$productDetails.name",
          product_images: "$productDetails.images",
          isRead: 1,
        },
      },
    ]);
    // console.log("allChat",allChat)
    // return res.send(allChat)
    if (allChat.length) {
      const result = await Promise.all(
        allChat.map(async (curChat) => {
          const buyer = curChat.members.filter((e) => e.type === "buyer");
          const allUser = curChat.all_users.map((user) => {
            if (user.role === "vendor") {
              return {
                ...user,
                name: curChat.vendor.name,
                company_name: curChat.vendor.company_name,
              };
            } else return user;
          });
          const isBought = await Order.findOne({
            product_id: curChat.product_id,
            user_id: buyer.user,
            is_paid: true,
          });
          console.log("isBought======", curChat.lastMsg.from);
          console.log("isBought======", userId);
          return {
            isPaid: isBought,
            all_users: allUser,
            _id: curChat._id,
            lastMsg: curChat.lastMsg,
            isRead: curChat.lastMsg.from.equals(userId) ? true : curChat.isRead,
            product: {
              name: curChat.product_name,
              _id: curChat.product_id,
              images: curChat.product_images,
            },
          };
        })
      );
      return res
        .status(200)
        .json({ status: true, msg: "Chat founds", data: result });
    } else {
      return res.status(200).json({ status: false, msg: "Chat not founds" });
    }
  } catch (er) {
    next(er);
  }
};

module.exports.test = async (req, res, next) => {
  try {
    const userId = "62acb1b37312aac00bc009e4";
    const allRooms = await Chat.findOne({
      members: ["62acb1b37312aac00bc009e4", "628b78f03a5cb854857fc074"],
    });
    res.send(allRooms);
  } catch (er) {
    next(er);
  }
};

module.exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.query;
    if (!chatId) {
      return res.status(400).json({ status: false, msg: " chatId not found." });
    }
    const allChat = await Chat.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(chatId),
        },
      },
      {
        $sort: {
          updatedAt: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "members.user",
          as: "all_users",
        },
      },
      {
        $lookup: {
          from: "vendors",
          foreignField: "user_id",
          localField: "all_users._id",
          as: "vendor",
        },
      },
      { $unwind: "$vendor" },
      {
        $lookup: {
          from: "products",
          foreignField: "_id",
          localField: "product",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: "$_id",
          message: 1,
          lastMsg: { $last: "$message" },
          "all_users.firstname": 1,
          "all_users.lastname": 1,
          "all_users._id": 1,
          "all_users.role": 1,
          "all_users.userName": 1,
          members: 1,
          vendor: 1,
          product_id: "$productDetails._id",
          product_name: "$productDetails.name",
          product_images: "$productDetails.images",
        },
      },
    ]);
    // console.log("allChat",allChat)
    // return res.send(allChat)
    if (allChat.length) {
      const curChat = allChat[0];
      if (curChat.lastMsg && !curChat.lastMsg.from.equals(userId)) {
        await Chat.findByIdAndUpdate(chatId, { isRead: true });
      }
      const buyer = curChat.members.filter((e) => e.type === "buyer");
      const allUser = curChat.all_users.map((user) => {
        if (user.role === "vendor") {
          return {
            ...user,
            name: curChat.vendor.name,
            company_name: curChat.vendor.company_name,
          };
        } else return user;
      });
      const isBought = await Order.findOne({
        product_id: curChat.product_id,
        user_id: buyer.user,
        is_paid: true,
      });
      const result = {
        isPaid: Boolean(isBought),
        all_users: allUser,
        _id: curChat._id,
        message: curChat.message,
        product: {
          name: curChat.product_name,
          _id: curChat.product_id,
          images: curChat.product_images,
        },
      };
      return res
        .status(200)
        .json({ status: true, msg: "Chat founds", data: result });
    } else {
      return res.status(200).json({ status: false, msg: "Chat not founds" });
    }
  } catch (er) {
    next(er);
  }
};

module.exports.UnreadMasg = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ status: false, msg: " userId not found." });
    }
    const allChat = await Chat.aggregate([
      {
        $match: {
          members: {
            $elemMatch: { user: new mongoose.Types.ObjectId(userId) },
          },
        },
      },

      {
        $project: {
          _id: "$_id",
          lastMsg: { $last: "$message" },
          isRead: 1,
        },
      },
    ]);
    // console.log("allChat",allChat)
    // return res.send(allChat)
    if (allChat.length) {
      const result = allChat.reduce( (prev,cur) => {
        console.log("cur",cur)
        console.log("prev",prev)
        if(!cur.lastMsg.from.equals(userId) && !cur.isRead){
          return prev + 1
        }
        else return prev
      },0);
      return res
        .status(200)
        .json({ status: true, msg: "Chat founds", data: result });
    } else {
      return res.status(200).json({ status: false, msg: "Chat not founds" });
    }
  } catch (er) {
    next(er);
  }
};
