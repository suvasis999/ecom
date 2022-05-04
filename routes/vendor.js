const vendor = require('../controller/vendor')
const express = require('express');
const router = express.Router();
const upload = require('../config/image-upload')
const authorization = require("../middleware/authorization")
const role = require("../config/role")

router.post('/apply',vendor.apply);
router.post('/upload-id/:id',upload.fields([{name:'doc_1'}, { name: 'doc_2'},{ name: 'doc_3'}]),vendor.uploadId);
router.post('/edit/:id',vendor.editVendor);
router.post('/approve/:id',authorization(),vendor.approveVendor);
router.post('/reject/:id',authorization(),vendor.rejectVendor);
router.get('/get-all',vendor.getAllVendor);
router.get('/get-approved',vendor.getApprovedVendor);
router.get('/get-pending',vendor.getPendingVendor);
router.get('/get-rejected',vendor.getRejectedVendor);
router.get('/count-vendor',vendor.countVendor);
router.get('/get-by-id/:id',vendor.getById);
router.get('/get-by-user-id/:user_id',vendor.getByUserId);

module.exports = router;  
