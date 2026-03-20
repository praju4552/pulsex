"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// User facing notifications
router.get('/', auth_1.authenticateToken, notificationController_1.getUserNotifications);
router.patch('/:id', auth_1.authenticateToken, notificationController_1.markAsRead);
router.patch('/read-all', auth_1.authenticateToken, notificationController_1.markAllAsRead);
router.delete('/clear', auth_1.authenticateToken, notificationController_1.clearNotifications);
router.delete('/:id', auth_1.authenticateToken, notificationController_1.deleteNotification);
exports.default = router;
