const express = require('express');
const router = express.Router();
const ProductController = require('../controller/productController');
const upload = require("../config/image-upload")

//for vendors
router.post("/create", ProductController.createProduct);
router.post("/edit/:id", ProductController.editProduct);
router.post("/upload-picture/:id",upload.array("product",10), ProductController.addPicture);
router.post("/change-stock/:id", ProductController.changeStock);
router.post("/delete/:id", ProductController.deleteProduct);
router.get("/get-by-id-vendor/:id", ProductController.getByIdVendor);
router.get("/get-all-vendor/:vendor_id", ProductController.getAllForVendor);

// for users
router.get("/get-by-id/:id", ProductController.getById);
router.get("/availability/:id", ProductController.availability);
router.get("/get-best-seller", ProductController.bestSeller);
router.get("/get-popular", ProductController.popular);
router.get("/get-new", ProductController.newProduct);
router.get("/get-category/:category", ProductController.category);

module.exports = router;
