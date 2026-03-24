import AdmZip from 'adm-zip';
import { Readable } from 'stream';

const pcbStackup = require('pcb-stackup');
const gerberToSvg = require('gerber-to-svg');

const LAYER_TYPE_MAP: Record<string, string> = {
  '.gtl': 'copper', '.cmp': 'copper',
  '.gbl': 'copper', '.sol': 'copper',
  '.g2': 'copper', '.g3': 'copper', '.g4': 'copper',
  '.gl2': 'copper', '.gl3': 'copper', '.gl4': 'copper',
  '.gts': 'soldermask', '.stc': 'soldermask',
  '.gbs': 'soldermask', '.sts': 'soldermask',
  '.gto': 'silkscreen', '.plc': 'silkscreen',
  '.gbo': 'silkscreen', '.pls': 'silkscreen',
  '.gtp': 'solderpaste', '.crc': 'solderpaste',
  '.gbp': 'solderpaste', '.crs': 'solderpaste',
  '.gko': 'outline', '.gm1': 'outline', '.gml': 'outline',
  '.drl': 'drill', '.xln': 'drill', '.exc': 'drill', '.txt': 'drill',
};

function getSide(filename: string): 'top' | 'bottom' | 'all' | 'inner' {
  const f = filename.toLowerCase();
  if (f.includes('f_cu') || f.includes('f.cu') || f.includes('front') || f.includes('-f.') || f.includes('f_mask') || f.includes('f.mask') || f.includes('f_silks') || f.includes('f.silks') || f.includes('f_paste') || f.includes('f.paste')) return 'top';
  if (f.includes('b_cu') || f.includes('b.cu') || f.includes('back') || f.includes('-b.') || f.includes('b_mask') || f.includes('b.mask') || f.includes('b_silks') || f.includes('b.silks') || f.includes('b_paste') || f.includes('b.paste')) return 'bottom';
  if (f.includes('edge') || f.includes('outline') || f.includes('profile') || f.includes('drill') || f.includes('npth') || f.includes('pth')) return 'all';
  if (f.includes('in1') || f.includes('in2') || f.includes('in3') || f.includes('in4') || f.includes('inner')) return 'inner';

  const ext = '.' + (f.split('.').pop() || '');
  if (['.gtl', '.gts', '.gto', '.gtp', '.cmp', '.stc', '.plc', '.crc'].includes(ext)) return 'top';
  if (['.gbl', '.gbs', '.gbo', '.gbp', '.sol', '.sts', '.pls', '.crs'].includes(ext)) return 'bottom';
  if (['.gko', '.gm1', '.gml', '.drl', '.xln', '.exc'].includes(ext)) return 'all';
  if (['.g2', '.g3', '.g4', '.gl2', '.gl3', '.gl4'].includes(ext)) return 'inner';

  return 'all';
}

function getLayerType(filename: string): string {
  const f = filename.toLowerCase();
  const ext = '.' + (f.split('.').pop() || '');
  if (f.includes('cu') || f.includes('copper')) return 'copper';
  if (f.includes('mask') || f.includes('soldermask')) return 'soldermask';
  if (f.includes('silk') || f.includes('silkscreen')) return 'silkscreen';
  if (f.includes('paste') || f.includes('solderpaste')) return 'solderpaste';
  if (f.includes('edge') || f.includes('outline') || f.includes('profile')) return 'outline';
  if (f.includes('drill') || f.includes('npth') || f.includes('pth')) return 'drill';
  return LAYER_TYPE_MAP[ext] || 'copper';
}

function parseOutlineDimensions(gerberText: string) {
  let units = 'mm';
  let xDecimal = 6;  // Bug 3 fix: modern Gerber default is 6, not 4
  let yDecimal = 6;

  // Bug 1 fix: correct regex for %MOMM*% and %MOIN*% format
  if (/%(MOMM)\*%/.test(gerberText)) units = 'mm';
  if (/%(MOIN)\*%/.test(gerberText)) units = 'in';

  const fsMatch = gerberText.match(/%FSLAX(\d)(\d)Y(\d)(\d)/);
  if (fsMatch) {
    xDecimal = parseInt(fsMatch[2], 10);
    yDecimal = parseInt(fsMatch[4], 10);
  }

  console.log('UNITS DETECTED:', units);
  console.log('X DECIMAL:', xDecimal);
  console.log('Y DECIMAL:', yDecimal);

  const xCoords: number[] = [];
  const yCoords: number[] = [];
  const lines = gerberText.split(/[*\n]/);

  lines.forEach(line => {
    const trimmed = line.trim();
    // Bug 2 fix: only collect coordinates from actual draw/move commands (D01, D02, D03)
    const isDrawCommand = /D0?[123]\*?$/.test(trimmed);
    if (!isDrawCommand) return;

    const xMatch = trimmed.match(/X(-?\d+)/);
    const yMatch = trimmed.match(/Y(-?\d+)/);

    if (xMatch) {
      xCoords.push(parseInt(xMatch[1], 10) / Math.pow(10, xDecimal));
    }
    if (yMatch) {
      yCoords.push(parseInt(yMatch[1], 10) / Math.pow(10, yDecimal));
    }
  });

  console.log('TOTAL X COORDS FOUND:', xCoords.length);
  console.log('TOTAL Y COORDS FOUND:', yCoords.length);
  console.log('RAW X SAMPLE (first 5):', xCoords.slice(0, 5));
  console.log('RAW Y SAMPLE (first 5):', yCoords.slice(0, 5));
  console.log('X MIN:', Math.min(...xCoords), 'X MAX:', Math.max(...xCoords));
  console.log('Y MIN:', Math.min(...yCoords), 'Y MAX:', Math.max(...yCoords));

  if (xCoords.length === 0 || yCoords.length === 0) return null;

  let width = Math.max(...xCoords) - Math.min(...xCoords);
  let height = Math.max(...yCoords) - Math.min(...yCoords);

  if (units === 'in') {
    width = width * 25.4;
    height = height * 25.4;
  }

  return {
    width: parseFloat(width.toFixed(2)),
    height: parseFloat(height.toFixed(2)),
    units: 'mm'
  };
}

function isGerberFile(filename: string): boolean {
  const f = filename.toLowerCase();
  const ext = f.split('.').pop() || '';
  const gerberExts = ['gtl','gbl','gts','gbs','gto','gbo','gtp','gbp','gko','gm1','gml','gbr','drl','xln','exc','g2','g3','g4','gl2','gl3','gl4','cmp','sol','stc','sts','plc','pls','crc','crs','art','pho','ger'];
  if (gerberExts.includes(ext)) return true;
  if (f.includes('f_cu') || f.includes('b_cu') || f.includes('f.cu') || f.includes('b.cu')) return true;
  if (f.includes('f_mask') || f.includes('b_mask') || f.includes('f.mask') || f.includes('b.mask')) return true;
  if (f.includes('f_silks') || f.includes('b_silks') || f.includes('edge_cuts') || f.includes('edge.cuts')) return true;
  if (f.includes('drill') || f.includes('.drl')) return true;
  return false;
}

// Convert gerber-to-svg output to a proper SVG string
function renderIndividualLayer(content: Buffer, layerColor: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const stream = new Readable();
      stream.push(content);
      stream.push(null);

      let svgString = '';
      const converter = gerberToSvg(stream, { color: layerColor });

      converter.on('data', (chunk: any) => {
        svgString += chunk.toString();
      });
      converter.on('end', () => resolve(svgString));
      converter.on('error', () => resolve(''));
    } catch {
      resolve('');
    }
  });
}

const LAYER_SVG_COLORS: Record<string, string> = {
  copper: '#c8a020',
  soldermask: '#006000',
  silkscreen: '#e0e0e0',
  solderpaste: '#888888',
  outline: '#FF6600',
  drill: '#cccccc',
};

export interface RenderedGerber {
  topSvg: string;
  bottomSvg: string;
  layers: Array<{
    filename: string;
    id: string;
    type: string;
    side: string;
    svg: string;        // ← individual layer SVG (new)
  }>;
  boardWidth: number;   // ← accurate board dimensions (new)
  boardHeight: number;
  boardUnits: string;
}

export async function renderGerberZip(zipBuffer: Buffer): Promise<RenderedGerber> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  const layerEntries: Array<{ name: string; content: Buffer; type: string; side: string; id: string }> = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.split('/').pop() || entry.entryName;
    if (!isGerberFile(name)) continue;
    const content = entry.getData();
    const type = getLayerType(name);
    const side = getSide(name);
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    layerEntries.push({ name, content, type, side, id });
  }

  if (layerEntries.length === 0) {
    throw new Error('No valid Gerber files found in the ZIP archive.');
  }

  // ── Step 1: Render each layer individually (for frontend toggle) ──────────────
  const individualSvgs = await Promise.all(
    layerEntries.map(async (layer) => {
      const color = LAYER_SVG_COLORS[layer.type] || '#888888';
      const svg = await renderIndividualLayer(layer.content, color);
      return { ...layer, svg };
    })
  );

  // ── Step 2: Get composite board view + accurate dimensions via pcb-stackup ────
  let topSvg = '';
  let bottomSvg = '';
  let boardWidth = 0;
  let boardHeight = 0;
  let boardUnits = 'mm';

  const stackupLayers = layerEntries.map(l => {
    const stream = new Readable();
    stream.push(l.content);
    stream.push(null);
    return { id: l.id, filename: l.name, gerber: stream, type: l.type, side: l.side };
  });

  try {
    const stackup = await pcbStackup(stackupLayers, {
      id: 'gerber-preview',
      maskWithOutline: true,
      outlineGapFill: 0.011,
    });

    topSvg = stackup.top.svg;
    bottomSvg = stackup.bottom.svg;

    // Extract accurate board dimensions
    const units = stackup.top.units || 'mm';
    let w = stackup.top.width || 0;
    let h = stackup.top.height || 0;

    // Convert inches to mm if needed
    if (units === 'in') {
      w = parseFloat((w * 25.4).toFixed(2));
      h = parseFloat((h * 25.4).toFixed(2));
      boardUnits = 'mm';
    } else {
      boardWidth = parseFloat(w.toFixed(2));
      boardHeight = parseFloat(h.toFixed(2));
      boardUnits = 'mm';
    }

    boardWidth = parseFloat(w.toFixed(2));
    boardHeight = parseFloat(h.toFixed(2));

    // ── Step 3: Precise Dimensions via Outline File Override (Fix for measurement bugs) 
    console.log('ALL LAYER TYPES FOUND:', layerEntries.map(l => l.type));
    const outlineLayer = layerEntries.find(l => l.type === 'outline');
    console.log('OUTLINE LAYER FOUND:', !!outlineLayer);
    
    if (outlineLayer) {
      const outlineText = outlineLayer.content.toString('utf8');
      console.log('=== OUTLINE FILE FIRST 50 LINES ===');
      console.log(outlineText.split('\n').slice(0, 50).join('\n'));
      console.log('=== END ===');
      
      const directDims = parseOutlineDimensions(outlineText);
      console.log('FINAL DIMS:', directDims);
      
      if (directDims && directDims.width > 0 && directDims.height > 0) {
        boardWidth = directDims.width;
        boardHeight = directDims.height;
        boardUnits = directDims.units;
      }
    }

  } catch {
    // If stackup fails, fall back to individual layer rendering only
    // Try without maskWithOutline
    try {
      const sl2 = layerEntries.map(l => {
        const stream = new Readable();
        stream.push(l.content);
        stream.push(null);
        return { id: l.id, filename: l.name, gerber: stream, type: l.type, side: l.side };
      });
      const stackup = await pcbStackup(sl2, { id: 'gerber-preview', maskWithOutline: false });
      topSvg = stackup.top.svg;
      bottomSvg = stackup.bottom.svg;
      const units = stackup.top.units || 'mm';
      let w = stackup.top.width || 0;
      let h = stackup.top.height || 0;
      if (units === 'in') { w = w * 25.4; h = h * 25.4; }
      boardWidth = parseFloat(w.toFixed(2));
      boardHeight = parseFloat(h.toFixed(2));

      // ── Step 3: Precise Dimensions via Outline File Override (Catch Fallback)
      console.log('ALL LAYER TYPES FOUND (FALLBACK):', layerEntries.map(l => l.type));
      const outlineLayerFallback = layerEntries.find(l => l.type === 'outline');
      console.log('OUTLINE LAYER FOUND (FALLBACK):', !!outlineLayerFallback);
      
      if (outlineLayerFallback) {
        const outlineText = outlineLayerFallback.content.toString('utf8');
        console.log('=== OUTLINE FILE FIRST 50 LINES (FALLBACK) ===');
        console.log(outlineText.split('\n').slice(0, 50).join('\n'));
        console.log('=== END ===');
        
        const directDims = parseOutlineDimensions(outlineText);
        console.log('FINAL DIMS (FALLBACK):', directDims);
        
        if (directDims && directDims.width > 0 && directDims.height > 0) {
          boardWidth = directDims.width;
          boardHeight = directDims.height;
          boardUnits = directDims.units;
        }
      }

    } catch (e2) {
      throw new Error(`Gerber rendering failed: ${e2 instanceof Error ? e2.message : String(e2)}`);
    }
  }

  return {
    topSvg,
    bottomSvg,
    layers: individualSvgs.map(l => ({
      filename: l.name,
      id: l.id,
      type: l.type,
      side: l.side,
      svg: l.svg,
    })),
    boardWidth,
    boardHeight,
    boardUnits,
  };
}
