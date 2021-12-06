const express = require('express');
const router = express.Router();
const ProductController = require('../../controller/productController');




router.get('/getall', ProductController.getAllProduct);
router.post('/add', ProductController.addProduct);
module.exports = router;
