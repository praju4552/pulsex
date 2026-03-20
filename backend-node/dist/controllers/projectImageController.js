"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateImageOrder = exports.deleteImage = exports.listImages = exports.uploadImage = void 0;
const db_1 = __importDefault(require("../db"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const API_URL = process.env.API_URL || 'http://localhost:3001';
// POST /api/project-template/admin/upload-image
const uploadImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }
        const { projectId, order } = req.body;
        if (!projectId) {
            res.status(400).json({ error: 'projectId is required' });
            return;
        }
        const adminId = req.user.userId;
        const project = yield db_1.default.projectTemplate.findUnique({ where: { id: projectId } });
        if (!project || project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Project not found or access denied' });
            return;
        }
        const imageUrl = `${API_URL}/uploads/project-templates/images/${req.file.filename}`;
        const image = yield db_1.default.projectImage.create({
            data: {
                projectId,
                imageUrl,
                order: order ? parseInt(order, 10) : 0,
            },
        });
        res.status(201).json(image);
    }
    catch (err) {
        console.error('uploadImage error:', err);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});
exports.uploadImage = uploadImage;
// GET /api/project-template/admin/images/:projectId
const listImages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.user.userId;
        const project = yield db_1.default.projectTemplate.findUnique({ where: { id: req.params.projectId } });
        if (!project || project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const images = yield db_1.default.projectImage.findMany({
            where: { projectId: req.params.projectId },
            orderBy: { order: 'asc' },
        });
        res.json(images);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});
exports.listImages = listImages;
// DELETE /api/project-template/admin/image/:id
const deleteImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.user.userId;
        const image = yield db_1.default.projectImage.findUnique({ where: { id: req.params.id }, include: { project: true } });
        if (!image || image.project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Image not found or access denied' });
            return;
        }
        // Delete file from disk
        try {
            const filename = image.imageUrl.split('/uploads/project-templates/images/').pop();
            if (filename) {
                const filePath = path_1.default.join(__dirname, '../../uploads/project-templates/images', filename);
                if (fs_1.default.existsSync(filePath))
                    fs_1.default.unlinkSync(filePath);
            }
        }
        catch (fsErr) {
            console.warn('Could not delete image file:', fsErr);
        }
        yield db_1.default.projectImage.delete({ where: { id: req.params.id } });
        res.json({ message: 'Image deleted' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete image' });
    }
});
exports.deleteImage = deleteImage;
// PATCH /api/project-template/admin/image/:id/order
const updateImageOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.user.userId;
        const { order } = req.body;
        const imageToUpdate = yield db_1.default.projectImage.findUnique({ where: { id: req.params.id }, include: { project: true } });
        if (!imageToUpdate || imageToUpdate.project.createdByAdminId !== adminId) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }
        const updated = yield db_1.default.projectImage.update({
            where: { id: req.params.id },
            data: { order: Number(order) },
        });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update image order' });
    }
});
exports.updateImageOrder = updateImageOrder;
