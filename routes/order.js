const router = require("express").Router();
const orderController = require("../controller/orderController");

router.post("/create", orderController.createOrder);
router.post("/cart-to-order", orderController.cartToOrder);
router.post("/cancel-order", orderController.cancelOrder);
router.post("/change-status", orderController.changeStatus);
router.post("/ship-order", orderController.shipOrder);
router.get("/get-by-id/:id", orderController.getById);
router.get("/all-user-order/:user_id", orderController.allOrderByUser);

router.get("/all-product-order/:vendor_id", orderController.allOrderByProduct);
router.get("/all-vendor-order/:vendor_id", orderController.allOrderByVendor);
router.get("/all-vendor-latest/:vendor_id", orderController.allLatestOrder);
router.get("/all-vendor-pending/:vendor_id", orderController.allPendingOrder);
router.get("/all-vendor-approved/:vendor_id", orderController.allApprovedOrder);
router.get("/all-vendor-shipped/:vendor_id", orderController.allShippedOrder);
router.get("/all-vendor-cancelled/:vendor_id", orderController.allCancelledOrder);
router.get("/all-vendor-delivered/:vendor_id", orderController.allDeliveredOrder);

router.get("/all-vendor-count/:vendor_id", orderController.allOrderCount);
router.get("/all-vendor-delivered-count/:vendor_id", orderController.allDeliveredOrderCount);
router.get("/all-vendor-pending-count/:vendor_id", orderController.allPendingCount);
router.get("/all-vendor-shipped-count/:vendor_id", orderController.allShippedCount);
router.get("/all-vendor-new-count/:vendor_id", orderController.allNewCount);
router.get("/all-vendor-cancel-count/:vendor_id", orderController.allCancelledOrderCount);

router.get("/all-shipped-order", orderController.allShippedOrderAdmin);

module.exports = router;
