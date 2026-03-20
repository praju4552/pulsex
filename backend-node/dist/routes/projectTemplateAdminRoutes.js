"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const projectTemplateUpload_1 = require("../middleware/projectTemplateUpload");
const projectTemplateAdminController_1 = require("../controllers/projectTemplateAdminController");
const projectImageController_1 = require("../controllers/projectImageController");
const router = (0, express_1.Router)();
// All admin routes require authentication + admin role
router.use(auth_1.authenticateToken);
router.use(auth_2.requireAdmin);
// Projects
router.get('/projects', projectTemplateAdminController_1.listAllProjects);
router.get('/project/:id', projectTemplateAdminController_1.getProjectById);
router.post('/project', projectTemplateUpload_1.ptUpload.single('heroVideo'), projectTemplateAdminController_1.createProject);
router.put('/project/:id', projectTemplateUpload_1.ptUpload.single('heroVideo'), projectTemplateAdminController_1.updateProject);
router.delete('/project/:id', projectTemplateAdminController_1.deleteProject);
// Sections
router.post('/section', projectTemplateAdminController_1.createSection);
router.put('/section/:id', projectTemplateAdminController_1.updateSection);
router.delete('/section/:id', projectTemplateAdminController_1.deleteSection);
// Lessons
router.post('/lesson', projectTemplateAdminController_1.createLesson);
router.put('/lesson/:id', projectTemplateAdminController_1.updateLesson);
router.delete('/lesson/:id', projectTemplateAdminController_1.deleteLesson);
// Images
router.post('/upload-image', projectTemplateUpload_1.ptImageUpload.single('image'), projectImageController_1.uploadImage);
router.get('/images/:projectId', projectImageController_1.listImages);
router.delete('/image/:id', projectImageController_1.deleteImage);
router.patch('/image/:id/order', projectImageController_1.updateImageOrder);
// Enrollment stats for admin users panel
router.get('/enrollments', projectTemplateAdminController_1.getEnrollmentStats);
exports.default = router;
