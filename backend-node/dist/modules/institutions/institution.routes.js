"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const institution_controller_1 = require("./institution.controller");
const router = (0, express_1.Router)();
// Routes mapped implicitly under `/api/admin/institutions`
router.get('/', institution_controller_1.institutionController.getAll);
router.post('/', institution_controller_1.institutionController.create);
router.get('/:id', institution_controller_1.institutionController.getById);
router.post('/:id/approve', institution_controller_1.institutionController.approve);
router.post('/:id/reject', institution_controller_1.institutionController.reject);
router.post('/:id/password', institution_controller_1.institutionController.updatePassword);
router.put('/:id', institution_controller_1.institutionController.update);
router.delete('/:id', institution_controller_1.institutionController.delete);
exports.default = router;
