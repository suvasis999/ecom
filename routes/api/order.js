const router = require("express").Router();
const orderController = require("../../controller/orderController");

router.post("/", orderController.placeOrder);
router.get("/:id", orderController.getorder);
router.put("/accept", orderController.acceptOrder);
router.put("/cancel", orderController.cancelOrder);
router.put("/shipped", orderController.orderShipped);
module.exports = router;
