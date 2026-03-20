"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cmsAdminController_1 = require("../controllers/cmsAdminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All CMS admin routes require SUPER_ADMIN
router.use(auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']));
router.get('/stats', cmsAdminController_1.getDashboardStats);
router.get('/users', cmsAdminController_1.listUsers);
router.get('/users/:id', cmsAdminController_1.getUserDetail);
router.get('/pricing', cmsAdminController_1.getPricingConfigs);
router.patch('/pricing', cmsAdminController_1.updatePricingConfig);
exports.default = router;
