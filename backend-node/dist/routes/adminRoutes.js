"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adminController_1 = require("../controllers/adminController");
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const requireAdmin_1 = require("../middleware/requireAdmin");
const router = (0, express_1.Router)();
// In-memory storage so the file buffer is available in req.file.buffer
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Protect all admin routes
router.use(auth_1.authenticateToken);
router.use(requireAdmin_1.requireAdmin);
router.get('/analytics', adminController_1.getAnalytics);
router.get('/users', adminController_1.getUsers);
router.delete('/users/:email/reset', adminController_1.resetUserProgress);
router.post('/users/bulk', upload.single('file'), adminController_1.bulkCreateUsers);
router.patch('/projects/:id', adminController_1.updateProject);
router.post('/users/:userId/credits', adminController_1.assignUserCredits);
// Skills
router.get('/skills', adminController_1.getSkills);
router.post('/skills', adminController_1.createSkill);
router.post('/projects/:id/skills', adminController_1.updateProjectSkills);
// Shop Orders
router.get('/orders', adminController_1.getAllOrders);
router.patch('/orders/:orderId/status', adminController_1.updateOrderStatus);
router.post('/shop/notify/:userId', adminController_1.sendUserNotification);
exports.default = router;
