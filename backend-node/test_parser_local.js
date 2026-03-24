/**
 * Local test for parseOutlineDimensions
 * Tests all 4 bug scenarios with realistic Gerber data
 */

function parseOutlineDimensions(gerberText) {
  let units = 'mm';
  let xDecimal = 6;
  let yDecimal = 6;

  if (/%(MOMM)\*%/.test(gerberText)) units = 'mm';
  if (/%(MOIN)\*%/.test(gerberText)) units = 'in';

  const fsMatch = gerberText.match(/%FSLAX(\d)(\d)Y(\d)(\d)/);
  if (fsMatch) {
    xDecimal = parseInt(fsMatch[2], 10);
    yDecimal = parseInt(fsMatch[4], 10);
  }

  console.log('  UNITS DETECTED:', units);
  console.log('  X DECIMAL:', xDecimal, '  Y DECIMAL:', yDecimal);

  const xCoords = [];
  const yCoords = [];
  const lines = gerberText.split(/[*\n]/);

  lines.forEach(line => {
    const trimmed = line.trim();
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

  console.log('  COORDS FOUND: X=' + xCoords.length + ', Y=' + yCoords.length);
  if (xCoords.length > 0) {
    console.log('  X RANGE:', Math.min(...xCoords), 'to', Math.max(...xCoords));
    console.log('  Y RANGE:', Math.min(...yCoords), 'to', Math.max(...yCoords));
  }

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

// ═══════════════════════════════════════════════════
// TEST 1: KiCad Edge_Cuts file (mm, FSLAX46Y46)
// Expected: 100mm x 80mm board
// ═══════════════════════════════════════════════════
console.log('\n=== TEST 1: KiCad (mm, FSLAX46Y46) — Expected: 100 x 80 mm ===');
const kicad = `G04 KiCad Edge.Cuts*
%MOMM*%
%FSLAX46Y46*%
%ADD10C,0.050000*%
D10*
X100000000Y80000000D02*
X200000000Y80000000D01*
X200000000Y160000000D01*
X100000000Y160000000D01*
X100000000Y80000000D01*
M02*`;
const r1 = parseOutlineDimensions(kicad);
console.log('  RESULT:', r1);
console.log('  STATUS:', (r1 && Math.abs(r1.width - 100) < 1 && Math.abs(r1.height - 80) < 1) ? '✅ PASS' : '❌ FAIL');

// ═══════════════════════════════════════════════════
// TEST 2: Altium with inches (FSLAX25Y25)
// Expected: ~25.4mm x 50.8mm (1in x 2in)
// ═══════════════════════════════════════════════════
console.log('\n=== TEST 2: Altium (inches, FSLAX25Y25) — Expected: ~25.4 x 50.8 mm ===');
const altium = `G04 Altium outline*
%MOIN*%
%FSLAX25Y25*%
%ADD10C,0.01000*%
D10*
X1000000Y1000000D02*
X2000000Y1000000D01*
X2000000Y3000000D01*
X1000000Y3000000D01*
X1000000Y1000000D01*
M02*`;
const r2 = parseOutlineDimensions(altium);
console.log('  RESULT:', r2);
console.log('  STATUS:', (r2 && Math.abs(r2.width - 25.4) < 1 && Math.abs(r2.height - 50.8) < 1) ? '✅ PASS' : '❌ FAIL');

// ═══════════════════════════════════════════════════
// TEST 3: Eagle (mm, FSLAX24Y24 — older format)
// Expected: 50mm x 30mm
// ═══════════════════════════════════════════════════
console.log('\n=== TEST 3: Eagle (mm, FSLAX24Y24) — Expected: 50 x 30 mm ===');
const eagle = `G04 Eagle outline*
%MOMM*%
%FSLAX24Y24*%
%ADD10C,0.100*%
D10*
X100000Y50000D02*
X600000Y50000D01*
X600000Y350000D01*
X100000Y350000D01*
X100000Y50000D01*
M02*`;
const r3 = parseOutlineDimensions(eagle);
console.log('  RESULT:', r3);
console.log('  STATUS:', (r3 && Math.abs(r3.width - 50) < 1 && Math.abs(r3.height - 30) < 1) ? '✅ PASS' : '❌ FAIL');

// ═══════════════════════════════════════════════════
// TEST 4: No %FSLAX% header (should use default decimal=6)
// Expected: 40mm x 60mm (coords in 6-decimal format)
// ═══════════════════════════════════════════════════
console.log('\n=== TEST 4: No FSLAX header (default decimal=6) — Expected: 40 x 60 mm ===');
const noHeader = `G04 Mystery file*
%MOMM*%
%ADD10C,0.050000*%
D10*
X10000000Y10000000D02*
X50000000Y10000000D01*
X50000000Y70000000D01*
X10000000Y70000000D01*
X10000000Y10000000D01*
M02*`;
const r4 = parseOutlineDimensions(noHeader);
console.log('  RESULT:', r4);
console.log('  STATUS:', (r4 && Math.abs(r4.width - 40) < 1 && Math.abs(r4.height - 60) < 1) ? '✅ PASS' : '❌ FAIL');

// ═══════════════════════════════════════════════════
// TEST 5: File with aperture definitions (garbage filter test)
// Should NOT pick up coords from %ADD... lines
// Expected: 20mm x 15mm
// ═══════════════════════════════════════════════════
console.log('\n=== TEST 5: Aperture garbage filter — Expected: 20 x 15 mm ===');
const withApertures = `G04 Board Outline*
%MOMM*%
%FSLAX46Y46*%
%ADD10C,0.254000*%
%ADD11R,1.524000X1.524000*%
%ADD12O,1.600000X1.600000*%
G04 Some comment X999999Y999999 here*
D10*
X100000000Y100000000D02*
X120000000Y100000000D01*
X120000000Y115000000D01*
X100000000Y115000000D01*
X100000000Y100000000D01*
M02*`;
const r5 = parseOutlineDimensions(withApertures);
console.log('  RESULT:', r5);
console.log('  STATUS:', (r5 && Math.abs(r5.width - 20) < 1 && Math.abs(r5.height - 15) < 1) ? '✅ PASS' : '❌ FAIL');

// ═══════════════════════════════════════════════════
// TEST 6: Board NOT starting at origin (offset board)  
// Expected: 30mm x 25mm (not 130mm x 125mm)
// ═══════════════════════════════════════════════════
console.log('\n=== TEST 6: Offset board (not at origin=0) — Expected: 30 x 25 mm ===');
const offset = `G04 Offset board*
%MOMM*%
%FSLAX46Y46*%
%ADD10C,0.050000*%
D10*
X100000000Y100000000D02*
X130000000Y100000000D01*
X130000000Y125000000D01*
X100000000Y125000000D01*
X100000000Y100000000D01*
M02*`;
const r6 = parseOutlineDimensions(offset);
console.log('  RESULT:', r6);
console.log('  STATUS:', (r6 && Math.abs(r6.width - 30) < 1 && Math.abs(r6.height - 25) < 1) ? '✅ PASS' : '❌ FAIL');

console.log('\n=== ALL TESTS COMPLETE ===\n');
