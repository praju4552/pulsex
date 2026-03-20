"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prototypingAuthController_1 = require("../controllers/prototypingAuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/signup', prototypingAuthController_1.signup);
router.post('/login', prototypingAuthController_1.login);
router.post('/google', prototypingAuthController_1.googleLogin);
router.post('/whatsapp/request-otp', prototypingAuthController_1.whatsappRequestOtp);
router.post('/whatsapp/verify', prototypingAuthController_1.whatsappVerifyOtp);
// Requires valid JWT — userId is read from the token, not request body
router.post('/update-profile', auth_1.authenticateToken, prototypingAuthController_1.updateProfile);
exports.default = router;
