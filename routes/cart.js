const router = require("express").Router();
const cartController = require("../controller/cartController");

router.post("/add", cartController.addToCart);
router.post("/wish-list-to-cart", cartController.wishListToCart);
router.post("/change-qty", cartController.changeQty);
router.post("/remove", cartController.removeProductFromCart);
router.get("/view/:user_id", cartController.viewCart);
router.get("/clear-cart/:user_id", cartController.ClearCart);

module.exports = router;