const userController = require('../controller/user')
const express = require('express');
const router = express.Router();
const Authentication = require("../middleware/pw_authorization")
const Auth = require("../middleware/auth")

router.post('/register',userController.register);
router.get('/verify-email/:token',userController.verifyEmail);
router.get('/resend-email/:email',userController.resendEmail);
router.post('/update/:id',Authentication('basic'),userController.update);
router.get('/check-user-name/:userName',userController.checkUserName);

router.post('/login',userController.login);
router.get('/logout/:id',userController.logout);
router.get('/forgot-pw/:email',userController.forgotpw);
router.get('/verify-otp',userController.verifyotp);
router.post('/change-pw',userController.changepw);
router.get('/get-by-id/:user_id',userController.getUserById);
router.get('/auth',userController.auth);
router.get('/user-count',userController.userCount);
router.post('/update-address/:id',userController.updateAddress);
router.post('/make-default-address',userController.makeDefaultAddress);
router.post('/delete-address/:id',userController.deleteAddress);

router.post('/change-pw-with-pw/:id',Authentication('basic'),userController.changePWWidthPW);
router.post('/wallet-update/:id',Authentication('basic'),userController.updateWallet);
router.post('/wallet-delete/:id',Auth,userController.deleteWallet);
router.get('/test',userController.test);

module.exports = router;  
