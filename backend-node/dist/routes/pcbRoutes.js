"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const pcbController_1 = require("../controllers/pcbController");
const router = (0, express_1.Router)();
// Keep file in memory for parsing (max 100 MB)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
});
// POST /api/pcb/parse-gerber
router.post('/parse-gerber', upload.single('gerberFile'), pcbController_1.parsePCBGerber);
// POST /api/pcb/render-gerber  — returns SVG renders
router.post('/render-gerber', upload.single('gerberFile'), pcbController_1.renderPCBGerber);
exports.default = router;
