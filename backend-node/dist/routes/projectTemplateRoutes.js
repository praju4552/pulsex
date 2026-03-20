"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const projectTemplateController_1 = require("../controllers/projectTemplateController");
const router = (0, express_1.Router)();
// Public (no auth required)
router.get('/', projectTemplateController_1.listProjects);
router.get('/project/:slug', projectTemplateController_1.getProject);
// Protected (user must be logged in)
router.post('/enroll', auth_1.authenticateToken, projectTemplateController_1.enrollUser);
router.get('/enrollment/:projectId', auth_1.authenticateToken, projectTemplateController_1.checkEnrollment);
router.post('/progress/:lessonId', auth_1.authenticateToken, projectTemplateController_1.completeLesson);
router.get('/progress/:projectId', auth_1.authenticateToken, projectTemplateController_1.getProjectProgress);
exports.default = router;
