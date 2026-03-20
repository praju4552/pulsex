"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cmsAuthController_1 = require("../controllers/cmsAuthController");
const router = (0, express_1.Router)();
router.post('/login', cmsAuthController_1.cmsLogin);
exports.default = router;
