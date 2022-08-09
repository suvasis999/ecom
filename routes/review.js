const Review = require('../controller/review')
const express = require('express');
const router = express.Router();


router.post('/add',Review.addReview);
router.post('/edit',Review.editReview);
router.get('/view/:product_id',Review.viewReview);
router.get('/user-review/:user_id',Review.viewReviewByUser);
router.get('/product-review/:product_id',Review.Reviewlist);

module.exports = router;  