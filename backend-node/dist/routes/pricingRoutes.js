"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cmsAdminController_1 = require("../controllers/cmsAdminController");
const router = (0, express_1.Router)();
router.get('/:key', cmsAdminController_1.getPublicPriceConfig);
exports.default = router;
