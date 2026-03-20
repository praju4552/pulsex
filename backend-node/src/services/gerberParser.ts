import AdmZip from 'adm-zip';
import * as path from 'path';

// ─── Layer Detection ─────────────────────────────────────────────────────────

// Gerber file layer patterns mapped to layer type
const LAYER_PATTERNS: Record<string, string> = {
  // Top copper
  '.gtl': 'Top Copper',    '.copper-top.gbr': 'Top Copper',    'f.cu.gbr': 'Top Copper',
  // Bottom copper
  '.gbl': 'Bottom Copper', '.copper-bot.gbr': 'Bottom Copper', 'b.cu.gbr': 'Bottom Copper',
  // Inner layers
  '.gl2': 'Inner Layer 2', '.gl3': 'Inner Layer 3', '.gl4': 'Inner Layer 4',
  '.g2': 'Inner Layer 2',  '.g3': 'Inner Layer 3',  '.g4': 'Inner Layer 4',
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

function detectLayerType(filename: string): string | null {
  const lower = filename.toLowerCase();
  for (const [pattern, type] of Object.entries(LAYER_PATTERNS)) {
    if (lower.endsWith(pattern) || lower.includes(pattern)) {
      return type;
    }
  }
  return null;
}

// Inner layer count detection
function countInnerLayers(filenames: string[]): number {
  const inner: Set<number> = new Set();
  const innerPatterns = [
    /\.g(\d+)$/i,      // .G2, .G3, .G4...
    /\.gl(\d+)$/i,     // .GL2, .GL3...
    /in(\d+)\.cu/i,    // in1.cu.gbr
    /inner[\-_]?(\d+)/i,  // inner-2.gbr
    /layer[\-_]?(\d+)/i,  // layer-2.gbr (heuristic)
  ];
  for (const f of filenames) {
    for (const re of innerPatterns) {
      const m = f.match(re);
      if (m) {
        const num = parseInt(m[1]);
        if (num >= 2 && num <= 16) inner.add(num);
      }
    }
  }
  return inner.size;
}

// ─── Gerber Coordinate Parsing ────────────────────────────────────────────────

interface Bounds {
  minX: number; maxX: number;
  minY: number; maxY: number;
}

function parseGerberBounds(content: string): Bounds | null {
  const bounds: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  let unit = 'mm'; // default
  let formatX = 2; // integer digits
  let formatY = 2;
  let decimalX = 4; // decimal digits
  let decimalY = 4;
  let hasCoords = false;

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect unit: %MOIN*% or %MOMM*%
    if (trimmed.includes('%MOIN*%') || trimmed.includes('MOIN')) {
      unit = 'inch';
    } else if (trimmed.includes('%MOMM*%') || trimmed.includes('MOMM')) {
      unit = 'mm';
    }

    // Detect format: %FSLAX24Y24*% or similar
    const fmtMatch = trimmed.match(/%FS[LT]A?X(\d)(\d)Y(\d)(\d)\*?%/i);
    if (fmtMatch) {
      formatX = parseInt(fmtMatch[1]);
      decimalX = parseInt(fmtMatch[2]);
      formatY = parseInt(fmtMatch[3]);
      decimalY = parseInt(fmtMatch[4]);
    }

    // Match coordinate lines like D01/D02/D03 commands
    const coordMatch = trimmed.match(/X(-?\d+)Y(-?\d+)/i);
    if (coordMatch) {
      const divisorX = Math.pow(10, decimalX);
      const divisorY = Math.pow(10, decimalY);
      let x = parseInt(coordMatch[1]) / divisorX;
      let y = parseInt(coordMatch[2]) / divisorY;

      // Convert inch → mm
      if (unit === 'inch') { x *= 25.4; y *= 25.4; }

      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
      hasCoords = true;
    }
  }

  if (!hasCoords) return null;

  return bounds;
}

// ─── Surface Finish Detection ─────────────────────────────────────────────────

function detectSurfaceFinish(filenames: string[]): string | null {
  const all = filenames.join(' ').toLowerCase();
  if (all.includes('enig') || all.includes('immersiongold')) return 'ENIG';
  if (all.includes('leadfree') || all.includes('lfhasl')) return 'LeadFree HASL';
  if (all.includes('hasl')) return 'HASL(with lead)';
  return null;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export interface ParsedPCBSpec {
  layers: number;
  dimX: number;
  dimY: number;
  dimUnit: 'mm';
  surfaceFinish: string | null;
  detectedLayers: string[];
  fileCount: number;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

export function parseGerberZip(zipBuffer: Buffer): ParsedPCBSpec {
  const warnings: string[] = [];
  let detectedLayers: string[] = [];
  let boardBounds: Bounds | null = null;
  let fileCount = 0;

  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    const filenames = entries.map(e => e.entryName);
    fileCount = entries.length;

    // Find layer files
    const layerSet: Set<string> = new Set();
    let hasTopCopper = false;
    let hasBottomCopper = false;
    let outlineEntry: AdmZip.IZipEntry | null = null;

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const name = entry.entryName;
      const layerType = detectLayerType(name);
      if (layerType) {
        layerSet.add(layerType);
        if (layerType === 'Top Copper') hasTopCopper = true;
        if (layerType === 'Bottom Copper') hasBottomCopper = true;
        if (layerType === 'Board Outline') outlineEntry = entry;
      }
    }

    // Try to parse board outline for dimensions
    if (outlineEntry) {
      try {
        const content = outlineEntry.getData().toString('utf8');
        boardBounds = parseGerberBounds(content);
      } catch (_) {
        warnings.push('Could not parse board outline file.');
      }
    }

    // If no explicit outline, try top copper as fallback
    if (!boardBounds) {
      for (const entry of entries) {
        if (entry.isDirectory) continue;
        const lt = detectLayerType(entry.entryName);
        if (lt === 'Top Copper') {
          try {
            const content = entry.getData().toString('utf8');
            boardBounds = parseGerberBounds(content);
            if (boardBounds) {
              warnings.push('Board outline estimated from Top Copper extents.');
              break;
            }
          } catch (_) {}
        }
      }
    }

    // Calculate layer count
    const innerCount = countInnerLayers(filenames);
    let layerCount = 1;
    if (hasTopCopper && hasBottomCopper) {
      layerCount = 2 + innerCount;
    } else if (hasTopCopper || hasBottomCopper) {
      layerCount = 1;
    } else {
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
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (boardBounds && hasTopCopper && hasBottomCopper) confidence = 'high';
    else if (boardBounds || (hasTopCopper && hasBottomCopper)) confidence = 'medium';

    // Dimensions from bounds
    let dimX = 0;
    let dimY = 0;
    if (boardBounds) {
      dimX = parseFloat((boardBounds.maxX - boardBounds.minX).toFixed(2));
      dimY = parseFloat((boardBounds.maxY - boardBounds.minY).toFixed(2));
      // Guard against nonsensical values
      if (dimX <= 0 || dimX > 1000) { dimX = 100; warnings.push('X dimension out of range — defaulted to 100mm.'); }
      if (dimY <= 0 || dimY > 1000) { dimY = 100; warnings.push('Y dimension out of range — defaulted to 100mm.'); }
    } else {
      warnings.push('Board dimensions could not be determined — set to 100×100mm.');
      dimX = 100;
      dimY = 100;
    }

    const surfaceFinish = detectSurfaceFinish(filenames);

    return { layers: layerCount, dimX, dimY, dimUnit: 'mm', surfaceFinish, detectedLayers, fileCount, confidence, warnings };

  } catch (err) {
    throw new Error(`Failed to parse Gerber ZIP: ${err instanceof Error ? err.message : String(err)}`);
  }
}
