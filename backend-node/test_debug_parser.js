const fs = require('fs');
const AdmZip = require('adm-zip');

const buf = fs.readFileSync('C:/Users/prajw/Downloads/LCSampleGerber (1).zip');
const zip = new AdmZip(buf);

const targetFile = 'jini_2_double_sde/OUTLINE.GKO';
const entry = zip.getEntry(targetFile);

if (!entry) {
  console.log('File not found:', targetFile);
  process.exit(1);
}

const data = entry.getData().toString('utf8');
console.log('--- FIRST 30 LINES OF', targetFile, '---');
console.log(data.split('\n').slice(0, 30).join('\n'));
console.log('----------------------------------');

// Let's run the exact manualCoordinateParse logic and log it
function debugParse(gerberData) {
  let isInch = false;
  if (gerberData.includes('%MOIN*%')) isInch = true;
  else if (gerberData.includes('%MOMM*%')) isInch = false;
  console.log('Units:', isInch ? 'INCH' : 'MM');

  let intX = 2, decX = 4, intY = 2, decY = 4;
  const fsMatch = gerberData.match(/%FS([LTD]?)([AI]?)X(\d)(\d)Y(\d)(\d)\*%/);
  if (fsMatch) {
    intX = parseInt(fsMatch[3], 10);
    decX = parseInt(fsMatch[4], 10);
    intY = parseInt(fsMatch[5], 10);
    decY = parseInt(fsMatch[6], 10);
    console.log('FS Match:', fsMatch[0], `decX=${decX} decY=${decY}`);
  } else {
    console.log('FS Match: NONE');
  }

  const divisorX = Math.pow(10, decX);
  const divisorY = Math.pow(10, decY);

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let count = 0;
  let lastX = 0, lastY = 0;

  const lines = gerberData.split(/\r?\n/);
  let debugLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('G04') || trimmed.startsWith('%') || trimmed.startsWith('M')) continue;

    const xM = trimmed.match(/X([+-]?\d+)/);
    const yM = trimmed.match(/Y([+-]?\d+)/);

    if (xM) lastX = parseInt(xM[1], 10);
    if (yM) lastY = parseInt(yM[1], 10);

    const isDraw = /D0?[123]\*/.test(trimmed) || 
                   (trimmed.endsWith('*') && (xM || yM) && !trimmed.startsWith('%'));

    if (debugLines < 20 && (xM || yM)) {
      console.log(`Line: ${trimmed} | isDraw: ${isDraw} | lastX: ${lastX} | lastY: ${lastY}`);
      debugLines++;
    }

    if (isDraw && (xM || yM)) {
      const x = lastX / divisorX;
      const y = lastY / divisorY;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      count++;
    }
  }

  console.log(`\nCoords tracked: ${count}`);
  console.log(`Bounds: X[${minX}, ${maxX}] Y[${minY}, ${maxY}]`);

  let w = maxX - minX;
  let h = maxY - minY;
  if (isInch) { w *= 25.4; h *= 25.4; }
  console.log(`Result: ${w.toFixed(2)} x ${h.toFixed(2)} mm`);
}

debugParse(data);
