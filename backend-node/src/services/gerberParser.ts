import AdmZip from 'adm-zip';
import * as path from 'path';
// Note: @tracespace loaded dynamically to prevent boot crash if missing

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

// ─── Universal Manual Coordinate Parser ───────────────────────────────────────
// Handles ALL Gerber dialects: KiCad, Altium, Eagle, EasyEDA, OrCAD, etc.

function manualCoordinateParse(gerberData: string): { width: number; height: number } | null {
  try {
    console.log('[gerberParser] Running universal manual coordinate parser...');

    // ── Step 1: Detect units ──
    let isInch = false; // Default to mm (safer assumption)
    if (gerberData.includes('%MOIN*%')) isInch = true;
    else if (gerberData.includes('%MOMM*%')) isInch = false;
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
    } else {
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
      if (trimmed.startsWith('G04') || trimmed.startsWith('%') || trimmed.startsWith('M')) continue;

      // Extract X coordinate from this line (if present)
      const xMatch = trimmed.match(/X([+\-]?\d+)/);
      // Extract Y coordinate from this line (if present)
      const yMatch = trimmed.match(/Y([+\-]?\d+)/);

      if (xMatch) lastX = parseInt(xMatch[1], 10);
      if (yMatch) lastY = parseInt(yMatch[1], 10);

      // Only track coordinates that are actual draw/move commands
      // D01=draw, D02=move, D03=flash, or inherited (no D code = previous mode)
      const isDraw = /D0?[123]\*/.test(trimmed) || 
                     (trimmed.endsWith('*') && (xMatch || yMatch) && !trimmed.startsWith('%'));

      if (isDraw && (xMatch || yMatch)) {
        const x = lastX / divisorX;
        const y = lastY / divisorY;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
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

    if (width <= 0 || height <= 0) return null;

    return { width, height };
  } catch (e) {
    console.error('[gerberParser] Manual Coordinate Parse threw exception:', e);
    return null;
  }
}

// ─── Tracespace Board Dimension Extraction ───────────────────────────────────

async function extractBoardDimensions(files: { filename: string; content: Buffer }[]): Promise<{ width: number; height: number } | null> {
  // Case 3: Wrap entire processing architecture securely
  try {
    console.log('[gerberParser] Starting Tracespace dimension extraction pipeline...');
    let createParser: any, plot: any, identifyLayers: any;
    let tracespaceAvailable = false;
    try {
      ({ createParser } = require('@tracespace/parser'));
      ({ plot } = require('@tracespace/plotter'));
      ({ identifyLayers } = require('@tracespace/identify-layers'));
      tracespaceAvailable = true;
    } catch (moduleErr: any) {
      console.error('[gerberParser] @tracespace not available natively. Proceeding to manual parsing.');
    }

    let outlineFile;
    if (tracespaceAvailable) {
      const identified = identifyLayers(files.map((f: any) => f.filename));
      outlineFile = files.find(f => {
        const info = (identified as any)[f.filename];
        const layerType = info?.type;
        return layerType === 'outline' ||
               f.filename.match(/\.(GKO|GM1|GBR|GML)$/i) ||
               f.filename.toLowerCase().includes('edge') ||
               f.filename.toLowerCase().includes('outline') ||
               f.filename.toLowerCase().includes('profile');
      });
    } else {
      // Without tracespace, use aggressive filename pattern matching
      outlineFile = files.find(f => {
        const lower = f.filename.toLowerCase();
        return lower.endsWith('.gko') || lower.endsWith('.gm1') || lower.endsWith('.gml') ||
               lower.endsWith('.bor') || lower.endsWith('.dim') ||
               lower.includes('edge') || lower.includes('outline') || 
               lower.includes('profile') || lower.includes('border') ||
               lower.includes('boardoutline') || lower.includes('board_outline') ||
               lower.includes('mechanical') || /\.gm\d+$/i.test(lower);
      });
    }

    // Case 1: If no outline file is found, scan ALL non-drill files for largest bounding box
    if (!outlineFile) {
      console.warn('[gerberParser] NO OUTLINE FILE IDENTIFIED. Files available:', files.map(f => f.filename));
      console.warn('[gerberParser] Escalating to full-directory greedy coordinate search.');
      
      let bestDims: { width: number; height: number } | null = null;
      let bestArea = 0;
      for (const f of files) {
        // Skip drill and non-gerber files
        const lower = f.filename.toLowerCase();
        if (lower.endsWith('.drl') || lower.endsWith('.exc') || lower.endsWith('.txt') ||
            lower.endsWith('.xln') || lower.endsWith('.ncd') || lower.endsWith('.csv') ||
            lower.endsWith('.pdf') || lower.endsWith('.png') || lower.endsWith('.jpg')) continue;
        
        try {
          const data = f.content.toString('utf8');
          // Quick check: is this actually a Gerber file? (must have % commands)
          if (!data.includes('%') && !data.includes('D01') && !data.includes('D02')) continue;
          
          const dims = manualCoordinateParse(data);
          if (dims) {
            const area = dims.width * dims.height;
            // Pick the SMALLEST valid bounding box (more likely to be the actual board, not a title block)
            if (bestDims === null || (area > 1 && area < bestArea)) {
              bestDims = dims;
              bestArea = area;
              console.log('[gerberParser] Candidate from', f.filename, ':', dims.width, 'x', dims.height, 'mm');
            }
          }
        } catch(e) {
          console.warn('[gerberParser] Failed to parse', f.filename, ':', e);
        }
      }
      if (bestDims) return bestDims;
      return null;
    }

    console.log('[gerberParser] SELECTING OUTLINE CANDIDATE:', outlineFile.filename);
    const outlineData = outlineFile.content.toString('utf8');

    let finalW = 0, finalH = 0;

    if (tracespaceAvailable) {
      const parser = createParser();
      parser.feed(outlineData);
      const tree = parser.results();
      const image = plot(tree as any);

      if (image && image.size && image.size.length === 4) {
        console.log('[gerberParser] RAW TRACESPACE ENVELOPE:', image.size);
        const [x1, y1, x2, y2] = image.size as [number, number, number, number];
        const w = x2 - x1;
        const h = y2 - y1;
        const factor = image.units === 'in' ? 25.4 : 1;
        finalW = parseFloat((w * factor).toFixed(2));
        finalH = parseFloat((h * factor).toFixed(2));
      } else {
        console.warn('[gerberParser] Tracespace returned an empty envelope bounds.');
      }
    }

    // Case 2: If Tracespace failed or returned 0, fallback to Manual string parsing
    if (finalW <= 0 || finalH <= 0) {
      console.warn('[gerberParser] Activating internal D-Code parser fallback mechanism...');
      const manualProps = manualCoordinateParse(outlineData);
      if (manualProps) {
        finalW = manualProps.width;
        finalH = manualProps.height;
      }
    }

    console.log('[gerberParser] BOUNDARY RESOLUTION:', finalW, 'x', finalH, 'mm');

    // Diagnostic Safety Rails
    if (finalW < 1 || finalH < 1 || finalW > 2000 || finalH > 2000) {
      console.error('[gerberParser] INVALID DIMENSIONS AFTER ALL ATTEMPTS:', finalW, finalH);
      console.error('[gerberParser] FALLING BACK TO SAFE 100x100 DEFAULTS.');
      return null;
    }

    return { width: finalW, height: finalH };
  } catch (err) {
    console.error('[gerberParser] extractBoardDimensions ENCOUNTERED FATAL ERROR:', err);
    return null; // Silent catch
  }
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

export async function parseGerberZip(zipBuffer: Buffer): Promise<ParsedPCBSpec> {
  const warnings: string[] = [];
  let detectedLayers: string[] = [];
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

    // ── Use Tracespace engine for precise board dimensions ──
    // Case 4: Flatten nested directory paths by isolating basename
    const gerberFiles = entries
      .filter(e => !e.isDirectory)
      .map(e => ({ filename: path.basename(e.entryName), content: e.getData() }));

    const traceDims = await extractBoardDimensions(gerberFiles);

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
    if (traceDims && hasTopCopper && hasBottomCopper) confidence = 'high';
    else if (traceDims || (hasTopCopper && hasBottomCopper)) confidence = 'medium';

    // Dimensions from Tracespace engine
    let dimX = 0;
    let dimY = 0;
    if (traceDims) {
      dimX = traceDims.width;
      dimY = traceDims.height;
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
