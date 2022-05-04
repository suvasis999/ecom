const express = require('express');
const router = express.Router();
const Wishlist = require('../controller/wishlist');

//for vendors
router.post("/add", Wishlist.add);
router.post("/remove", Wishlist.remove);
router.get("/get/:user_id", Wishlist.get);


module.exports = router;
