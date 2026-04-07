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
exports.parsePCBGerber = parsePCBGerber;
exports.renderPCBGerber = renderPCBGerber;
const fs_1 = __importDefault(require("fs"));
const gerberParser_1 = require("../services/gerberParser");
const gerberRenderer_1 = require("../services/gerberRenderer");
// Helper: silently delete a temp Gerber file after processing
function cleanupTempFile(filePath) {
    fs_1.default.unlink(filePath, (err) => {
        if (err)
            console.error('[pcbController] Failed to delete temp Gerber file:', err);
    });
}
function parsePCBGerber(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded. Please upload a .zip or .rar file containing your Gerber files.' });
            }
            // Extension validation is handled by the multer fileFilter in pcbRoutes.ts.
            // This secondary check is kept as a defence-in-depth guard.
            const allowedExts = ['.zip', '.rar', '.gbz', '.gbr', '.gtl', '.gbl', '.gto', '.gbo', '.gts', '.gbs', '.drl', '.xln'];
            const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
            if (!allowedExts.includes(ext)) {
                cleanupTempFile(req.file.path);
                return res.status(400).json({ error: 'Only .zip, .rar, or .gbz files are accepted.' });
            }
            // Read from disk — file was saved by multer diskStorage
            const fileBuffer = yield fs_1.default.promises.readFile(req.file.path);
            const parsed = yield (0, gerberParser_1.parseGerberZip)(fileBuffer);
            // Clean up temp file after successful processing
            cleanupTempFile(req.file.path);
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
            // Clean up temp file on error too
            if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path)
                cleanupTempFile(req.file.path);
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
        var _a;
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded.' });
            }
            const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
            if (!['.zip', '.rar', '.gbz'].includes(ext)) {
                cleanupTempFile(req.file.path);
                return res.status(400).json({ error: 'Only .zip files are accepted for rendering.' });
            }
            console.log(`[renderPCBGerber] Rendering ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
            // Read from disk — file was saved by multer diskStorage
            const fileBuffer = yield fs_1.default.promises.readFile(req.file.path);
            const result = yield (0, gerberRenderer_1.renderGerberZip)(fileBuffer);
            // Clean up temp file after successful processing
            cleanupTempFile(req.file.path);
            return res.json({
                success: true,
                topSvg: result.topSvg,
                bottomSvg: result.bottomSvg,
                layers: result.layers,
            });
        }
        catch (err) {
            // Clean up temp file on error too
            if ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path)
                cleanupTempFile(req.file.path);
            console.error('[renderPCBGerber] Error:', err);
            return res.status(500).json({
                error: 'Failed to render Gerber files.',
                detail: err instanceof Error ? err.message : String(err),
            });
        }
    });
}
