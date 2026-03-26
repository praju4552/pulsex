"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.parseGerberZip = parseGerberZip;
const adm_zip_1 = __importDefault(require("adm-zip"));
const path = __importStar(require("path"));
// Note: @tracespace loaded dynamically to prevent boot crash if missing
// ─── Layer Detection ─────────────────────────────────────────────────────────
// Gerber file layer patterns mapped to layer type
const LAYER_PATTERNS = {
    // Top copper
    '.gtl': 'Top Copper', '.copper-top.gbr': 'Top Copper', 'f.cu.gbr': 'Top Copper',
    // Bottom copper
    '.gbl': 'Bottom Copper', '.copper-bot.gbr': 'Bottom Copper', 'b.cu.gbr': 'Bottom Copper',
    // Inner layers
    '.gl2': 'Inner Layer 2', '.gl3': 'Inner Layer 3', '.gl4': 'Inner Layer 4',
    '.g2': 'Inner Layer 2', '.g3': 'Inner Layer 3', '.g4': 'Inner Layer 4',
    'in1.cu.gbr': 'Inner Layer 1', 'in2.cu.gbr': 'Inner Layer 2',
    'in3.cu.gbr': 'Inner Layer 3', 'in4.cu.gbr': 'Inner Layer 4',
    // Board outline
    '.gko': 'Board Outline', '.gm1': 'Board Outline', '.gml': 'Board Outline',
    'edge.cuts.gbr': 'Board Outline', 'profile.gbr': 'Board Outline',
    // Top/Bottom silk
    '.gto': 'Top Silkscreen', '.gbo': 'Bottom Silkscreen',
    'f.silks.gbr': 'Top Silkscreen', 'b.silks.gbr': 'Bottom Silkscreen',
    // Top/Bottom solder mask
    '.gts': 'Top Solder Mask', '.gbs': 'Bottom Solder Mask',
    'f.mask.gbr': 'Top Solder Mask', 'b.mask.gbr': 'Bottom Solder Mask',
    // Drill files
    '.xln': 'Drill', '.drl': 'Drill', '.exc': 'Drill',
    '.excellon': 'Drill', '.ncd': 'Drill', '.tap': 'Drill',
};
function detectLayerType(filename) {
    const lower = filename.toLowerCase();
    for (const [pattern, type] of Object.entries(LAYER_PATTERNS)) {
        if (lower.endsWith(pattern) || lower.includes(pattern)) {
            return type;
        }
    }
    return null;
}
// Inner layer count detection
function countInnerLayers(filenames) {
    const inner = new Set();
    const innerPatterns = [
        /\.g(\d+)$/i, // .G2, .G3, .G4...
        /\.gl(\d+)$/i, // .GL2, .GL3...
        /in(\d+)\.cu/i, // in1.cu.gbr
        /inner[\-_]?(\d+)/i, // inner-2.gbr
        /layer[\-_]?(\d+)/i, // layer-2.gbr (heuristic)
    ];
    for (const f of filenames) {
        for (const re of innerPatterns) {
            const m = f.match(re);
            if (m) {
                const num = parseInt(m[1]);
                if (num >= 2 && num <= 16)
                    inner.add(num);
            }
        }
    }
    return inner.size;
}
// ─── Universal Manual Coordinate Parser ───────────────────────────────────────
// Handles ALL Gerber dialects: KiCad, Altium, Eagle, EasyEDA, OrCAD, etc.
function manualCoordinateParse(gerberData) {
    try {
        console.log('[gerberParser] Running universal manual coordinate parser...');
        // ── Step 1: Detect units ──
        let isInch = false; // Default to mm (safer assumption)
        if (gerberData.includes('%MOIN*%'))
            isInch = true;
        else if (gerberData.includes('%MOMM*%'))
            isInch = false;
        console.log('[gerberParser] Units detected:', isInch ? 'INCH' : 'MM');
        // ── Step 2: Parse Format Specification ──
        // Formats: %FSLAX24Y24*%, %FSLAX36Y36*%, %FSTAX25Y25*%, etc.
        let intX = 2, decX = 4, intY = 2, decY = 4;
        let hasFS = false;
        const fsMatch = gerberData.match(/%FS([LTD]?)([AI]?)X(\d)(\d)Y(\d)(\d)\*%/);
        if (fsMatch) {
            intX = parseInt(fsMatch[3], 10);
            decX = parseInt(fsMatch[4], 10);
            intY = parseInt(fsMatch[5], 10);
            decY = parseInt(fsMatch[6], 10);
            hasFS = true;
            console.log('[gerberParser] FS header found:', fsMatch[0], `X=${intX}.${decX} Y=${intY}.${decY}`);
        }
        else {
            console.warn('[gerberParser] No %FS header found — using defaults X2.4 Y2.4');
        }
        const divisorX = Math.pow(10, decX);
        const divisorY = Math.pow(10, decY);
        // ── Step 3: Extract ALL coordinates using multiple strategies ──
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let coordCount = 0;
        let lastX = 0, lastY = 0;
        // Split into lines for line-by-line parsing (handles ALL formats)
        const lines = gerberData.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            // Skip comments, aperture definitions, and macro commands
            if (trimmed.startsWith('G04') || trimmed.startsWith('%') || trimmed.startsWith('M'))
                continue;
            // Extract X coordinate from this line (if present)
            const xMatch = trimmed.match(/X([+\-]?\d+)/);
            // Extract Y coordinate from this line (if present)
            const yMatch = trimmed.match(/Y([+\-]?\d+)/);
            if (xMatch)
                lastX = parseInt(xMatch[1], 10);
            if (yMatch)
                lastY = parseInt(yMatch[1], 10);
            // Only track coordinates that are actual draw/move commands
            // D01=draw, D02=move, D03=flash, or inherited (no D code = previous mode)
            const isDraw = /D0?[123]\*/.test(trimmed) ||
                (trimmed.endsWith('*') && (xMatch || yMatch) && !trimmed.startsWith('%'));
            if (isDraw && (xMatch || yMatch)) {
                const x = lastX / divisorX;
                const y = lastY / divisorY;
                if (x < minX)
                    minX = x;
                if (x > maxX)
                    maxX = x;
                if (y < minY)
                    minY = y;
                if (y > maxY)
                    maxY = y;
                coordCount++;
            }
        }
        console.log('[gerberParser] Total coordinates extracted:', coordCount);
        if (coordCount < 2) {
            console.warn('[gerberParser] Not enough coordinates found for bounding box');
            return null;
        }
        let w = maxX - minX;
        let h = maxY - minY;
        // Convert to mm if in inches
        if (isInch) {
            w *= 25.4;
            h *= 25.4;
        }
        const width = parseFloat(w.toFixed(2));
        const height = parseFloat(h.toFixed(2));
        console.log('[gerberParser] Manual parse result:', width, 'x', height, 'mm');
        if (width <= 0 || height <= 0)
            return null;
        return { width, height };
    }
    catch (e) {
        console.error('[gerberParser] Manual Coordinate Parse threw exception:', e);
        return null;
    }
}
// ─── Tracespace Board Dimension Extraction ───────────────────────────────────
function extractBoardDimensions(files, warnings) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('[gerberParser] Starting dimension extraction (manual parser only)...');
            // ── Step 1: Find the outline file ──
            let outlineFile = files.find(f => {
                const lower = f.filename.toLowerCase();
                return lower.endsWith('.gko') || lower.endsWith('.gm1') || lower.endsWith('.gml') ||
                    lower.endsWith('.bor') || lower.endsWith('.dim') ||
                    lower.includes('edge') || lower.includes('outline') ||
                    lower.includes('profile') || lower.includes('border') ||
                    lower.includes('boardoutline') || lower.includes('board_outline') ||
                    lower.includes('mechanical') || /\.gm\d+$/i.test(lower);
            });
            // ── Step 2: If no outline file, scan ALL non-drill Gerber files ──
            if (!outlineFile) {
                // (Removed debug warning: "No outline file found...")
                let bestDims = null;
                let maxArea = 0;
                for (const f of files) {
                    const lower = f.filename.toLowerCase();
                    if (lower.endsWith('.drl') || lower.endsWith('.exc') || lower.endsWith('.txt'))
                        continue;
                    const data = f.content.toString('utf8');
                    if (!data.includes('%') && !data.includes('D01') && !data.includes('D02'))
                        continue;
                    const dims = manualCoordinateParse(data);
                    if (dims) {
                        const area = dims.width * dims.height;
                        if (dims.width < 1000 && dims.height < 1000 && (bestDims === null || area > maxArea)) {
                            bestDims = dims;
                            maxArea = area;
                            // (Removed debug warning: "Found candidate in...")
                        }
                    }
                }
                if (bestDims)
                    return bestDims;
                warnings.push(`No valid bounding boxes found in any file.`);
                return null;
            }
            // ── Step 3: Parse the outline file with our manual parser ──
            const outlineData = outlineFile.content.toString('utf8');
            const manualDims = manualCoordinateParse(outlineData);
            if (manualDims && manualDims.width > 0 && manualDims.height > 0) {
                if (manualDims.width < 1 || manualDims.height < 1 || manualDims.width > 2000 || manualDims.height > 2000) {
                    warnings.push(`Dimensions out of range — discarding.`);
                    return null;
                }
                return manualDims;
            }
            warnings.push(`Could not automatically extract dimensions from ${outlineFile.filename}`);
            return null;
        }
        catch (err) {
            warnings.push(`extractBoardDimensions crash: ${err instanceof Error ? err.message : String(err)}`);
            return null;
        }
    });
}
// ─── Surface Finish Detection ─────────────────────────────────────────────────
function detectSurfaceFinish(filenames) {
    const all = filenames.join(' ').toLowerCase();
    if (all.includes('enig') || all.includes('immersiongold'))
        return 'ENIG';
    if (all.includes('leadfree') || all.includes('lfhasl'))
        return 'LeadFree HASL';
    if (all.includes('hasl'))
        return 'HASL(with lead)';
    return null;
}
function parseGerberZip(zipBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const warnings = [];
        let detectedLayers = [];
        let fileCount = 0;
        try {
            const zip = new adm_zip_1.default(zipBuffer);
            const entries = zip.getEntries();
            const filenames = entries.map(e => e.entryName);
            fileCount = entries.length;
            // Find layer files
            const layerSet = new Set();
            let hasTopCopper = false;
            let hasBottomCopper = false;
            let outlineEntry = null;
            for (const entry of entries) {
                if (entry.isDirectory)
                    continue;
                const name = entry.entryName;
                const layerType = detectLayerType(name);
                if (layerType) {
                    layerSet.add(layerType);
                    if (layerType === 'Top Copper')
                        hasTopCopper = true;
                    if (layerType === 'Bottom Copper')
                        hasBottomCopper = true;
                    if (layerType === 'Board Outline')
                        outlineEntry = entry;
                }
            }
            // ── Use Tracespace engine for precise board dimensions ──
            // Case 4: Flatten nested directory paths by isolating basename
            const gerberFiles = entries
                .filter(e => !e.isDirectory)
                .map(e => ({ filename: path.basename(e.entryName), content: e.getData() }));
            const traceDims = yield extractBoardDimensions(gerberFiles, warnings);
            // Calculate layer count
            const innerCount = countInnerLayers(filenames);
            let layerCount = 1;
            if (hasTopCopper && hasBottomCopper) {
                layerCount = 2 + innerCount;
            }
            else if (hasTopCopper || hasBottomCopper) {
                layerCount = 1;
            }
            else {
                warnings.push('Could not auto-detect copper layers — defaulting to 2.');
                layerCount = 2;
            }
            // Snap layer count to supported values
            const supported = [1, 2, 4, 6, 8, 10, 12, 14, 16];
            if (!supported.includes(layerCount)) {
                const closest = supported.reduce((a, b) => Math.abs(b - layerCount) < Math.abs(a - layerCount) ? b : a);
                warnings.push(`Detected ${layerCount} layers — snapped to nearest supported value ${closest}.`);
                layerCount = closest;
            }
            detectedLayers = Array.from(layerSet);
            // Confidence level
            let confidence = 'low';
            if (traceDims && hasTopCopper && hasBottomCopper)
                confidence = 'high';
            else if (traceDims || (hasTopCopper && hasBottomCopper))
                confidence = 'medium';
            // Dimensions from Tracespace engine
            let dimX = 0;
            let dimY = 0;
            if (traceDims) {
                dimX = traceDims.width;
                dimY = traceDims.height;
                // Guard against nonsensical values
                if (dimX <= 0 || dimX > 1000) {
                    dimX = 100;
                    warnings.push('X dimension out of range — defaulted to 100mm.');
                }
                if (dimY <= 0 || dimY > 1000) {
                    dimY = 100;
                    warnings.push('Y dimension out of range — defaulted to 100mm.');
                }
            }
            else {
                warnings.push('Board dimensions could not be determined — set to 100×100mm.');
                dimX = 100;
                dimY = 100;
            }
            const surfaceFinish = detectSurfaceFinish(filenames);
            return { layers: layerCount, dimX, dimY, dimUnit: 'mm', surfaceFinish, detectedLayers, fileCount, confidence, warnings };
        }
        catch (err) {
            throw new Error(`Failed to parse Gerber ZIP: ${err instanceof Error ? err.message : String(err)}`);
        }
    });
}
