"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All user routes require authentication
router.use(auth_1.authenticateToken);
router.post('/search', userController_1.saveSearch);
router.post('/project-view/:projectId', userController_1.trackProjectView);
router.get('/dashboard', userController_1.getUserDashboard);
router.get('/history', userController_1.getUserHistory);
router.delete('/history/:id', userController_1.deleteHistoryItem);
router.delete('/history', userController_1.clearUserHistory);
exports.default = router;
