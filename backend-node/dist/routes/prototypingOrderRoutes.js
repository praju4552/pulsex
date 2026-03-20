"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prototypingOrderController_1 = require("../controllers/prototypingOrderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ── PUBLIC routes (no token required) ─────────────────────────────────────────
// Allow guest order placement and public order tracking status
router.post('/', prototypingOrderController_1.createPrototypingOrder);
router.get('/track/:orderRef', prototypingOrderController_1.trackPrototypingOrder);
// ── AUTHENTICATED USER routes ──────────────────────────────────────────────────
// User must be logged in to view their orders or download their documents
router.get('/user/:userId', auth_1.authenticateToken, prototypingOrderController_1.listUserPrototypingOrders);
router.get('/:id/download', auth_1.authenticateToken, prototypingOrderController_1.downloadPrototypingDocument);
// ── ADMIN-ONLY routes ──────────────────────────────────────────────────────────
// Must be whitelisted SUPER_ADMIN email (prajwalshetty4552@gmail.com or pulsewritexsolutions@gmail.com)
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']), prototypingOrderController_1.listPrototypingOrders);
router.get('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']), prototypingOrderController_1.getPrototypingOrder);
router.patch('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['SUPER_ADMIN']), prototypingOrderController_1.updatePrototypingOrder);
exports.default = router;
