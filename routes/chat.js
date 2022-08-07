const router = require("express").Router();
const chatController = require("../controller/chat");

router.get("/test", chatController.test);
router.get("/all-chat/:userId", chatController.AllChat);
router.get("/all-message/:chatId", chatController.getMessages);
router.get("/unread-msg/:userId", chatController.UnreadMasg);

module.exports = router;