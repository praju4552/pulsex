"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
router.post('/create-order', auth_1.authenticateToken, paymentController_1.initiatePayment);
router.post('/verify', auth_1.authenticateToken, paymentController_1.verifyPayment);
exports.default = router;
