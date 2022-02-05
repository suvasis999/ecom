const newsController = require("../../controller/newsController");
const express = require("express");
const router = express.Router();

router.post("/", newsController.createNews);

router.get("/", newsController.getNews);

router.get("/:id", newsController.getNewsById);

router.post("/:id", newsController.removeNews);

module.exports = router;
