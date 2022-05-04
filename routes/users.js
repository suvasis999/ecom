const userController = require('../controller/user')
const express = require('express');
const router = express.Router();


router.post('/register',userController.register);

router.post('/login',userController.login);
router.get('/logout/:id',userController.logout);
router.get('/forgot-pw/:email',userController.forgotpw);
router.get('/verify-otp',userController.verifyotp);
router.post('/change-pw',userController.changepw);
router.get('/get-by-id/:user_id',userController.getUserById);
router.get('/auth',userController.auth);
router.get('/user-count',userController.userCount);
module.exports = router;  
