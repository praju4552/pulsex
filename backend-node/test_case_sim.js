const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');

// 1. Load your local gerberParser.ts function code via requiring the compiled JS
const { parseGerberZip } = require('./dist/services/gerberParser.js');

// 2. We want to FORCE extractBoardDimensions to run WITHOUT Tracespace
// Let's modify the loaded JS in memory to bypass Tracespace or create a test script that replicates it

const buf = fs.readFileSync('C:/Users/prajw/Downloads/LCSampleGerber (1).zip');

// We will replicate extractBoardDimensions here to see EXACTLY what is chosen and what is returned

const zip = new AdmZip(buf);
const entries = zip.getEntries();
const gerberFiles = entries
  .filter(e => !e.isDirectory)
  .map(e => ({ filename: path.basename(e.entryName), content: e.getData() }));

console.log('--- FILES GIVEN TO EXTRACTOR ---');
gerberFiles.forEach(f => console.log(f.filename));

function manualCoordinateParse(gerberData) {
  try {
    let isInch = false;
    if (gerberData.includes('%MOIN*%')) isInch = true;
    else if (gerberData.includes('%MOMM*%')) isInch = false;

    let intX = 2, decX = 4, intY = 2, decY = 4;
    const fsMatch = gerberData.match(/%FS([LTD]?)([AI]?)X(\d)(\d)Y(\d)(\d)\*%/);
    if (fsMatch) {
      intX = parseInt(fsMatch[3], 10); decX = parseInt(fsMatch[4], 10);
      intY = parseInt(fsMatch[5], 10); decY = parseInt(fsMatch[6], 10);
    }
    const divisorX = Math.pow(10, decX); const divisorY = Math.pow(10, decY);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let count = 0; let lastX = 0, lastY = 0;

    const lines = gerberData.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('G04') || trimmed.startsWith('%') || trimmed.startsWith('M')) continue;
      const xMatch = trimmed.match(/X([+\-]?\d+)/);
      const yMatch = trimmed.match(/Y([+\-]?\d+)/);
      if (xMatch) lastX = parseInt(xMatch[1], 10);
      if (yMatch) lastY = parseInt(yMatch[1], 10);
      const isDraw = /D0?[123]\*/.test(trimmed) || (trimmed.endsWith('*') && (xMatch || yMatch) && !trimmed.startsWith('%'));
      if (isDraw && (xMatch || yMatch)) {
        const x = lastX / divisorX; const y = lastY / divisorY;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        count++;
      }
    }
    if (count < 2) return null;
    let w = maxX - minX; let h = maxY - minY;
    if (isInch) { w *= 25.4; h *= 25.4; }
    return { width: parseFloat(w.toFixed(2)), height: parseFloat(h.toFixed(2)) };
  } catch (e) { return null; }
}

let outlineFile = gerberFiles.find(f => {
  const lower = f.filename.toLowerCase();
  const match = lower.endsWith('.gko') || lower.endsWith('.gm1') || lower.endsWith('.gml') ||
         lower.endsWith('.bor') || lower.endsWith('.dim') ||
         lower.includes('edge') || lower.includes('outline') || 
         lower.includes('profile') || lower.includes('border') ||
         lower.includes('boardoutline') || lower.includes('board_outline') ||
         lower.includes('mechanical') || /\.gm\d+$/i.test(lower);
  return match;
});

console.log('\n--- OUTLINE RECOGNITION ---');
console.log('Matched outlineFile:', outlineFile ? outlineFile.filename : 'NONE');

if (!outlineFile) {
  console.log('\n--- CASE 1 (No Explicit Outline) ---');
  let bestDims = null;
  let bestArea = 0;
  for (const f of gerberFiles) {
    const lower = f.filename.toLowerCase();
    if (lower.endsWith('.drl') || lower.endsWith('.exc') || lower.endsWith('.txt')) continue;
    const data = f.content.toString('utf8');
    if (!data.includes('%') && !data.includes('D01')) continue;
    
    const dims = manualCoordinateParse(data);
    if (dims) {
      const area = dims.width * dims.height;
      if (bestDims === null || (area > 1 && area < bestArea)) {
        bestDims = dims;
        bestArea = area;
        console.log(`Candidate: ${f.filename} -> ${dims.width}x${dims.height} mm (Area: ${area.toFixed(1)})`);
      }
    }
  }
} else {
  console.log('\n--- CASE 2 (Outline File Found) ---');
  const d = outlineFile.content.toString('utf8');
  const manual = manualCoordinateParse(d);
  console.log('manualCoordinateParse result:', manual);
}
