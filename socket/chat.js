// const ActiveUserModel = require("../models/activeUser");
// const User = require('../models/user')
// const locationModel = require('../models/location');
const Chat = require("../models/chat");
const Order = require("../models/Order");
class chatSocket {
  notification;
  constructor(io) {
    this.notification = io;
    this.notification.on("connection", async (socket) => {
      const { userId } = socket.handshake.query;
      console.log("user connected",userId)
      if (userId) {
        const allRooms = await Chat.find({ "members.user": { $in: [userId] } })
        if (allRooms.length) {
          const allRoomId = allRooms.map((room) => room._id.toString());
          socket.join(allRoomId);
        }
      }
      socket.on("create_room", async (data) => {
        let chat_id = null;
        console.log("create room ", data)
        const existChat = await Chat.findOne({ "members.user": [data.from.user, data.to.user] })
        const productId = data.productId;
        if (existChat == null) {
          const newChat = await Chat.create({
            members: [data.from, data.to],
            product: productId,
          });
          chat_id = newChat._id;
        } else {
          chat_id = existChat._id;
          if (!existChat.product.equals(productId)) {
            existChat.product = productId;
            await existChat.save();
          }
        }
        console.log("create room", chat_id, data);
        socket.join(chat_id);
        this.notification.to(chat_id).emit("room_joined", chat_id);
      });
      socket.on("send_message", async (data) => {
        console.log("sendong msg", data);
        Chat.findByIdAndUpdate(
          data.room,
          {
            $push: {
              message: {
                from: data.from,
                time: data.time,
                body: data.body,
                attachment:data.attachment
              },
            },
            isRead:false
          },
          (er, doc) => {
            if (!er) {
              socket.to(data.room).emit("receive_message", data);
            } else {
              console.log(er);
            }
          }
        );
      });

      socket.on("typing", async (data) => {
        socket.to(data.room).emit("typing", data);
      });

      socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
      });
    });
  }
}

module.exports = chatSocket;
