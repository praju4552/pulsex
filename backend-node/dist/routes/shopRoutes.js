"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const shopController_1 = require("../controllers/shopController");
const router = (0, express_1.Router)();
// All shop routes require authentication
router.use(auth_1.authenticateToken);
router.post('/cart', shopController_1.syncCart);
router.post('/cart/confirm', shopController_1.confirmCart);
router.get('/shipping', shopController_1.getShippingDetails);
router.post('/shipping', shopController_1.saveShippingDetails);
router.post('/orders', shopController_1.placeOrder);
router.get('/orders', shopController_1.getMyOrders);
exports.default = router;
