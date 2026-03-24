import AdmZip from 'adm-zip';
import { Readable } from 'stream';
import { createParser } from '@tracespace/parser';
import { plot } from '@tracespace/plotter';
import { identifyLayers as identify } from '@tracespace/identify-layers';

const pcbStackup = require('pcb-stackup');
const gerberToSvg = require('gerber-to-svg');

async function extractBoardDimensions(files: { filename: string; content: Buffer }[]): Promise<{ width: number; height: number; units: string } | null> {
  try {
    // Step A: Identify which file is the board outline
    const identified = identify(files.map(f => f.filename));
    
    const outlineFile = files.find(f => {
      const layerType = identified[f.filename]?.type;
      return layerType === 'outline' || 
             f.filename.match(/\.(GKO|GM1|GBR)$/i) ||
             f.filename.toLowerCase().includes('edge') ||
             f.filename.toLowerCase().includes('outline') ||
             f.filename.toLowerCase().includes('profile');
    });

    if (!outlineFile) {
      console.error('NO OUTLINE FILE FOUND. Available files:', files.map(f => f.filename));
      return null;
    }

    console.log('USING OUTLINE FILE:', outlineFile.filename);

    // Step B: Parse the Gerber file
    const parser = createParser();
    const gerberText = outlineFile.content.toString('utf8');
    
    let tree;
    try {
      parser.feed(gerberText);
      tree = parser.results(); // v5 returns a single Root AST node, not an array
    } catch(e) {
      console.error('PARSER ERROR:', e);
      return null;
    }

    if (!tree) {
      console.error('PARSE RESULT IS NULL');
      return null;
    }

    // Step C: Plot to get bounding box
    const image = plot(tree as any);
    
    if (!image || !image.size || image.size.length === 0) {
      console.error('IMAGE OR SIZE ENVELOPE IS NULL');
      return null;
    }

    console.log('RAW SIZE ENVELOPE:', image.size);
    console.log('IMAGE UNITS:', image.units);

    // ImageTree in v5 stores size as [x1, y1, x2, y2]
    const [x1, y1, x2, y2] = image.size as [number, number, number, number];
    const width = x2 - x1;
    const height = y2 - y1;

    // Step D: Convert to mm if needed
    const factor = image.units === 'in' ? 25.4 : 1;
    const finalWidth  = parseFloat((width  * factor).toFixed(2));
    const finalHeight = parseFloat((height * factor).toFixed(2));

    console.log('FINAL WIDTH MM:', finalWidth);
    console.log('FINAL HEIGHT MM:', finalHeight);

    if (finalWidth <= 0 || finalHeight <= 0) {
      console.error('INVALID DIMENSIONS: zero or negative');
      return null;
    }

    if (finalWidth > 1000 || finalHeight > 1000) {
      console.warn('WARNING: Dimensions exceed 1000mm, may be incorrect');
    }

    return {
      width: finalWidth,
      height: finalHeight,
      units: 'mm'
    };

  } catch (err) {
    console.error('extractBoardDimensions ERROR:', err);
    return null;
  }
}

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
  // IMPORTANT: Check outline/drill BEFORE copper — 'Edge_Cuts' contains 'cu' which falsely matches copper
  if (f.includes('edge') || f.includes('outline') || f.includes('profile') || f.includes('board') || f.includes('border')) return 'outline';
  if (f.includes('drill') || f.includes('npth') || f.includes('pth')) return 'drill';
  if (f.includes('cu') || f.includes('copper')) return 'copper';
  if (f.includes('mask') || f.includes('soldermask')) return 'soldermask';
  if (f.includes('silk') || f.includes('silkscreen')) return 'silkscreen';
  if (f.includes('paste') || f.includes('solderpaste')) return 'solderpaste';
  return LAYER_TYPE_MAP[ext] || 'copper';
}

// Removed parseOutlineDimensions: heuristic was causing false-positives containing title blocks
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

    // ── Step 3: Precise Dimensions via Tracespace Override ──
    const traceDims = await extractBoardDimensions(layerEntries.map(l => ({
      filename: l.name || l.type,
      content: Buffer.isBuffer(l.content) ? l.content : Buffer.from(l.content)
    })));

    if (traceDims) {
      boardWidth = traceDims.width;
      boardHeight = traceDims.height;
      boardUnits = traceDims.units;
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

      // ── Step 3: Precise Dimensions via Tracespace Override (Fallback) ──
      const traceDimsFallback = await extractBoardDimensions(layerEntries.map(l => ({
        filename: l.name || l.type,
        content: Buffer.isBuffer(l.content) ? l.content : Buffer.from(l.content)
      })));

      if (traceDimsFallback) {
        boardWidth = traceDimsFallback.width;
        boardHeight = traceDimsFallback.height;
        boardUnits = traceDimsFallback.units;
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
