"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const liveClassController_1 = require("../controllers/liveClassController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// User + Admin
router.get('/', auth_1.authenticateToken, liveClassController_1.getAllLiveClasses);
// Admin Only
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, liveClassController_1.createLiveClass);
router.patch('/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, liveClassController_1.toggleLiveStatus);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, liveClassController_1.deleteLiveClass);
exports.default = router;
