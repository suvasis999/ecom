const router = require("express").Router();
const orderController = require("../../controller/orderController");

router.post("/", orderController.placeOrder);
router.get("/:id", orderController.getOrders);
router.put("/accept/:id", orderController.acceptOrder);
router.put("/cancel/:id", orderController.cancelOrder);
router.put("/shipped/:id", orderController.orderShipped);

module.exports = router;
