import AdmZip from 'adm-zip';
import { Readable } from 'stream';

// pcb-stackup is a CommonJS module
const pcbStackup = require('pcb-stackup');

/**
 * Layer type identifiers used by pcb-stackup
 * Must match: https://github.com/tracespace/tracespace/blob/main/packages/whats-that-gerber/
 */
const LAYER_TYPE_MAP: Record<string, string> = {
  // Top copper
  '.gtl': 'copper', '.cmp': 'copper',
  // Bottom copper
  '.gbl': 'copper', '.sol': 'copper',
  // Inner copper
  '.g2': 'copper', '.g3': 'copper', '.g4': 'copper',
  '.gl2': 'copper', '.gl3': 'copper', '.gl4': 'copper',
  // Top soldermask
  '.gts': 'soldermask', '.stc': 'soldermask',
  // Bottom soldermask
  '.gbs': 'soldermask', '.sts': 'soldermask',
  // Top silkscreen
  '.gto': 'silkscreen', '.plc': 'silkscreen',
  // Bottom silkscreen
  '.gbo': 'silkscreen', '.pls': 'silkscreen',
  // Top solderpaste
  '.gtp': 'solderpaste', '.crc': 'solderpaste',
  // Bottom solderpaste
  '.gbp': 'solderpaste', '.crs': 'solderpaste',
  // Board outline
  '.gko': 'outline', '.gm1': 'outline', '.gml': 'outline',
  // Drill
  '.drl': 'drill', '.xln': 'drill', '.exc': 'drill', '.txt': 'drill',
};

function getSide(filename: string): 'top' | 'bottom' | 'all' | 'inner' {
  const f = filename.toLowerCase();
  // KiCad-style
  if (f.includes('f_cu') || f.includes('f.cu') || f.includes('front') || f.includes('-f.') || f.includes('f_mask') || f.includes('f.mask') || f.includes('f_silks') || f.includes('f.silks') || f.includes('f_paste') || f.includes('f.paste')) return 'top';
  if (f.includes('b_cu') || f.includes('b.cu') || f.includes('back') || f.includes('-b.') || f.includes('b_mask') || f.includes('b.mask') || f.includes('b_silks') || f.includes('b.silks') || f.includes('b_paste') || f.includes('b.paste')) return 'bottom';
  if (f.includes('edge') || f.includes('outline') || f.includes('profile') || f.includes('drill') || f.includes('npth') || f.includes('pth')) return 'all';
  if (f.includes('in1') || f.includes('in2') || f.includes('in3') || f.includes('in4') || f.includes('inner')) return 'inner';

  // Extension-based (Eagle/Protel-style)
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
  
  // KiCad-style name detection
  if (f.includes('cu') || f.includes('copper')) return 'copper';
  if (f.includes('mask') || f.includes('soldermask')) return 'soldermask';
  if (f.includes('silk') || f.includes('silkscreen')) return 'silkscreen';
  if (f.includes('paste') || f.includes('solderpaste')) return 'solderpaste';
  if (f.includes('edge') || f.includes('outline') || f.includes('profile')) return 'outline';
  if (f.includes('drill') || f.includes('npth') || f.includes('pth')) return 'drill';
  
  return LAYER_TYPE_MAP[ext] || 'copper';
}

function isGerberFile(filename: string): boolean {
  const f = filename.toLowerCase();
  const ext = f.split('.').pop() || '';
  const gerberExts = ['gtl','gbl','gts','gbs','gto','gbo','gtp','gbp','gko','gm1','gml','gbr','drl','xln','exc','g2','g3','g4','gl2','gl3','gl4','cmp','sol','stc','sts','plc','pls','crc','crs','art','pho','ger'];
  
  if (gerberExts.includes(ext)) return true;
  // KiCad naming
  if (f.includes('f_cu') || f.includes('b_cu') || f.includes('f.cu') || f.includes('b.cu')) return true;
  if (f.includes('f_mask') || f.includes('b_mask') || f.includes('f.mask') || f.includes('b.mask')) return true;
  if (f.includes('f_silks') || f.includes('b_silks') || f.includes('edge_cuts') || f.includes('edge.cuts')) return true;
  if (f.includes('drill') || f.includes('.drl')) return true;
  
  return false;
}

export interface RenderedGerber {
  topSvg: string;
  bottomSvg: string;
  layers: Array<{
    filename: string;
    id: string;
    type: string;
    side: string;
  }>;
}

export async function renderGerberZip(zipBuffer: Buffer): Promise<RenderedGerber> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  
  const layers: Array<{ id: string; filename: string; gerber: Readable; type: string; side: string }> = [];
  const layerInfo: Array<{ id: string; filename: string; type: string; side: string }> = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.split('/').pop() || entry.entryName;
    
    if (!isGerberFile(name)) continue;
    
    const content = entry.getData();
    const type = getLayerType(name);
    const side = getSide(name);
    const layerId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Create a readable stream from the buffer
    const stream = new Readable();
    stream.push(content);
    stream.push(null);
    
    layers.push({ id: layerId, filename: name, gerber: stream, type, side });
    layerInfo.push({ id: layerId, filename: name, type, side });
  }

  if (layers.length === 0) {
    throw new Error('No valid Gerber files found in the ZIP archive.');
  }

  try {
    const stackup = await pcbStackup(layers, {
      // id used for SVG element IDs
      id: 'gerber-preview',
      // Use outline for masking
      maskWithOutline: true,
      // Fill small outline gaps
      outlineGapFill: 0.011,
    });

    return {
      topSvg: stackup.top.svg,
      bottomSvg: stackup.bottom.svg,
      layers: layerInfo,
    };
  } catch (err) {
    // Retry without maskWithOutline if it fails
    try {
      const stackup = await pcbStackup(layers.map(l => {
        // Recreate streams since they were consumed
        const entry = zip.getEntries().find(e => (e.entryName.split('/').pop() || e.entryName) === l.filename);
        if (!entry) return l;
        const stream = new Readable();
        stream.push(entry.getData());
        stream.push(null);
        return { ...l, gerber: stream };
      }), {
        id: 'gerber-preview',
        maskWithOutline: false,
      });

      return {
        topSvg: stackup.top.svg,
        bottomSvg: stackup.bottom.svg,
        layers: layerInfo,
      };
    } catch (retryErr) {
      throw new Error(`Gerber rendering failed: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`);
    }
  }
}
