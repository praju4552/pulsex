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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePCBGerber = parsePCBGerber;
exports.renderPCBGerber = renderPCBGerber;
const gerberParser_1 = require("../services/gerberParser");
const gerberRenderer_1 = require("../services/gerberRenderer");
function parsePCBGerber(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded. Please upload a .zip or .rar file containing your Gerber files.' });
            }
            const allowedMimes = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream', 'application/x-rar'];
            const allowedExts = ['.zip', '.rar', '.gbz'];
            const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
            if (!allowedExts.includes(ext)) {
                return res.status(400).json({ error: 'Only .zip, .rar, or .gbz files are accepted.' });
            }
            const parsed = yield (0, gerberParser_1.parseGerberZip)(req.file.buffer);
            return res.json({
                success: true,
                filename: req.file.originalname,
                fileSize: req.file.size,
                parsedSpec: {
                    layers: parsed.layers,
                    dimX: parsed.dimX,
                    dimY: parsed.dimY,
                    dimUnit: parsed.dimUnit,
                    finish: parsed.surfaceFinish,
                },
                analysis: {
                    detectedLayers: parsed.detectedLayers,
                    fileCount: parsed.fileCount,
                    confidence: parsed.confidence,
                    warnings: parsed.warnings,
                }
            });
        }
        catch (err) {
            console.error('[parsePCBGerber] Error:', err);
            return res.status(500).json({
                error: 'Failed to parse Gerber files.',
                detail: err instanceof Error ? err.message : String(err),
            });
        }
    });
}
function renderPCBGerber(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded.' });
            }
            const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
            if (!['.zip', '.rar', '.gbz'].includes(ext)) {
                return res.status(400).json({ error: 'Only .zip files are accepted for rendering.' });
            }
            console.log(`[renderPCBGerber] Rendering ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
            const result = yield (0, gerberRenderer_1.renderGerberZip)(req.file.buffer);
            return res.json({
                success: true,
                topSvg: result.topSvg,
                bottomSvg: result.bottomSvg,
                layers: result.layers,
            });
        }
        catch (err) {
            console.error('[renderPCBGerber] Error:', err);
            return res.status(500).json({
                error: 'Failed to render Gerber files.',
                detail: err instanceof Error ? err.message : String(err),
            });
        }
    });
}
