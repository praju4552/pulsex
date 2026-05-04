/**
 * Gerber Rendering Worker Script
 * This is executed in a separate process via child_process.spawn()
 * to prevent memory-heavy rendering from crashing the main process (503 error).
 */
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const AdmZip = require('adm-zip');

// 🪵 Direct file logging for diagnostics
const logPath = '/home/u655334071/domains/pulsewritexsolutions.com/nodejs/tmp/deep_debug.log';
const workerLog = (msg) => {
    try {
        const timestamp = new Date().toISOString();
        const line = `[GERBER-WORKER] [${timestamp}] ${msg}`;
        fs.appendFileSync(logPath, line + '\n');
        console.error(line); // console.error for logging, stdout for JSON results
    } catch(e) {
        // silently fail log
    }
};

workerLog('Worker process started');

// Require the heavy libraries
let pcbStackup, gerberToSvg, tracespaceParser, tracespacePlotter, identify;
try {
    pcbStackup = require('pcb-stackup');
    gerberToSvg = require('gerber-to-svg');
    ({ createParser: tracespaceParser } = require('@tracespace/parser'));
    ({ plot: tracespacePlotter } = require('@tracespace/plotter'));
    ({ identifyLayers: identify } = require('@tracespace/identify-layers'));
    workerLog('Libraries loaded successfully');
} catch (err) {
    workerLog('CRITICAL: Failed to load libraries: ' + err.message);
    process.exit(1);
}

const LAYER_SVG_COLORS = {
    copper: '#c8a020',
    soldermask: '#006000',
    silkscreen: '#e0e0e0',
    solderpaste: '#888888',
    outline: '#FF6600',
    drill: '#cccccc',
};

async function renderIndividualLayer(content, layerColor) {
    return new Promise((resolve) => {
        try {
            const stream = new Readable();
            stream.push(content);
            stream.push(null);
            let svgString = '';
            const converter = gerberToSvg(stream, { color: layerColor });
            converter.on('data', (chunk) => { svgString += chunk.toString(); });
            converter.on('end', () => resolve(svgString));
            converter.on('error', () => resolve(''));
        } catch { resolve(''); }
    });
}

function getLayerType(filename) {
    const f = filename.toLowerCase();
    const ext = '.' + (f.split('.').pop() || '');
    if (f.includes('edge') || f.includes('outline') || f.includes('profile') || f.includes('board') || f.includes('border') || ['.gko', '.gm1', '.gml'].includes(ext)) return 'outline';
    if (f.includes('drill') || f.includes('npth') || f.includes('pth') || ['.drl', '.xln', '.exc', '.txt'].includes(ext)) return 'drill';
    if (f.includes('cu') || f.includes('copper') || ['.gtl', '.gbl', '.g2', '.g3', '.g4', '.gl2', '.gl3', '.gl4', '.cmp', '.sol'].includes(ext)) return 'copper';
    if (f.includes('mask') || f.includes('soldermask') || ['.gts', '.gbs', '.stc', '.sts'].includes(ext)) return 'soldermask';
    if (f.includes('silk') || f.includes('silkscreen') || ['.gto', '.gbo', '.plc', '.pls'].includes(ext)) return 'silkscreen';
    if (f.includes('paste') || f.includes('solderpaste') || ['.gtp', '.gbp', '.crc', '.crs'].includes(ext)) return 'solderpaste';
    return null; // Return null if not a recognized functional layer
}

function getSide(filename) {
    const f = filename.toLowerCase();
    if (f.includes('f_cu') || f.includes('f.cu') || f.includes('front') || f.includes('-f.') || f.includes('f_mask') || f.includes('f.mask') || f.includes('f_silks') || f.includes('f.silks') || f.includes('f_paste') || f.includes('f.paste')) return 'top';
    if (f.includes('b_cu') || f.includes('b.cu') || f.includes('back') || f.includes('-b.') || f.includes('b_mask') || f.includes('b.mask') || f.includes('b_silks') || f.includes('b.silks') || f.includes('b_paste') || f.includes('b.paste')) return 'bottom';
    if (f.includes('edge') || f.includes('outline') || f.includes('profile') || f.includes('drill') || f.includes('npth') || f.includes('pth')) return 'all';
    if (f.includes('in1') || f.includes('in2') || f.includes('in3') || f.includes('in4') || f.includes('inner')) return 'inner';
    const ext = '.' + (f.split('.').pop() || '');
    if (['.gtl', '.gts', '.gto', '.gtp', '.cmp', '.stc', '.plc', '.crc'].includes(ext)) return 'top';
    if (['.gbl', '.gbs', '.gbo', '.gbp', '.sol', '.sts', '.pls', '.crs'].includes(ext)) return 'bottom';
    return 'all';
}

async function extractBoardDimensions(files) {
    try {
        const identified = identify(files.map(f => f.filename));
        const outlineFile = files.find(f => {
            const layerType = identified[f.filename]?.type;
            return layerType === 'outline' || f.filename.match(/\.(GKO|GM1|GBR)$/i) || f.filename.toLowerCase().includes('edge') || f.filename.toLowerCase().includes('outline');
        });
        if (!outlineFile) return null;
        const parser = tracespaceParser();
        parser.feed(outlineFile.content.toString('utf8'));
        const tree = parser.results();
        if (!tree) return null;
        const image = tracespacePlotter(tree);
        if (!image || !image.size) return null;
        const [x1, y1, x2, y2] = image.size;
        const factor = image.units === 'in' ? 25.4 : 1;
        return { width: parseFloat(((x2 - x1) * factor).toFixed(2)), height: parseFloat(((y2 - y1) * factor).toFixed(2)), units: 'mm' };
    } catch { return null; }
}

// ── Read from STDIN ────────────────────────────────────────────────────────
let zipBuffer = Buffer.alloc(0);
process.stdin.on('data', chunk => { zipBuffer = Buffer.concat([zipBuffer, chunk]); });
process.stdin.on('end', async () => {
    try {
        workerLog(`Received ${zipBuffer.length} bytes for processing`);
        const zip = new AdmZip(zipBuffer);
        const entries = zip.getEntries();
        const layerEntries = [];

        for (const entry of entries) {
            if (entry.isDirectory) continue;
            const name = entry.entryName.split('/').pop() || entry.entryName;
            
            // Skip non-functional files like Mac metadata or text readmes
            if (name.startsWith('.') || name.startsWith('__MACOSX')) continue;
            
            const type = getLayerType(name);
            if (!type) continue; // Skip unrecognized layers (User: "remove them if they are not in use")
            
            const content = entry.getData();
            const side = getSide(name);
            const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            layerEntries.push({ name, content, type, side, id });
        }

        if (layerEntries.length === 0) throw new Error('No functional Gerber files found in archive.');
        workerLog(`Processing ${layerEntries.length} functional layers`);

        // Render individual SVGs
        const individualSvgs = await Promise.all(layerEntries.map(async (layer) => {
            const color = LAYER_SVG_COLORS[layer.type] || '#888888';
            const svg = await renderIndividualLayer(layer.content, color);
            return { filename: layer.name, id: layer.id, type: layer.type, side: layer.side, svg };
        }));

        // Render composite stackup
        const stackupLayers = layerEntries.map(l => {
            const stream = new Readable();
            stream.push(l.content);
            stream.push(null);
            return { id: l.id, filename: l.name, gerber: stream, type: l.type, side: l.side };
        });

        const stackup = await pcbStackup(stackupLayers, { id: 'gerber-preview', maskWithOutline: true, outlineGapFill: 0.011 });
        const units = stackup.top.units || 'mm';
        const factor = units === 'in' ? 25.4 : 1;
        let boardWidth = parseFloat((stackup.top.width * factor).toFixed(2));
        let boardHeight = parseFloat((stackup.top.height * factor).toFixed(2));

        // Precision dimension override
        const traceDims = await extractBoardDimensions(layerEntries.map(l => ({ filename: l.name, content: l.content })));
        if (traceDims) {
            boardWidth = traceDims.width;
            boardHeight = traceDims.height;
        }

        const result = {
            success: true,
            topSvg: stackup.top.svg,
            bottomSvg: stackup.bottom.svg,
            layers: individualSvgs,
            boardWidth,
            boardHeight,
            boardUnits: 'mm'
        };

        workerLog('Processing complete, sending results');
        process.stdout.write(JSON.stringify(result));
    } catch (err) {
        workerLog(`ERROR: ${err.message}`);
        process.stdout.write(JSON.stringify({ success: false, error: err.message }));
    } finally {
        process.exit(0);
    }
});
