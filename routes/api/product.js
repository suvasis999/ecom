const express = require('express');
const router = express.Router();
const ProductController = require('../../controller/productController');





router.get("/", ProductController.getProducts);
router.get("/:id", ProductController.getProductById);
router.delete("/:id", ProductController.removeProduct);
router.post("/", ProductController.createProduct);


module.exports = router;
