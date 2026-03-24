function parseOutlineDimensions(gerberText) {
  let units = 'mm'; // default
  let xDecimal = 4; // default
  let yDecimal = 4; // default

  // 1. Units conversion (BUG 2)
  if (gerberText.includes('%MOMM%') || gerberText.includes('%MOMM*')) units = 'mm';
  if (gerberText.includes('%MOIN%') || gerberText.includes('%MOIN*')) units = 'in';

  // 2. Format statement division (BUG 1)
  // %FSLAX34Y34*%
  const fsMatch = gerberText.match(/%FSLAX(\d)(\d)Y(\d)(\d)/);
  if (fsMatch) {
    xDecimal = parseInt(fsMatch[2], 10);
    yDecimal = parseInt(fsMatch[4], 10);
  }

  // 3. Coordinate extraction
  const xCoords = [];
  const yCoords = [];

  // Match X and Y in streams: X1234Y5678, X1234, Y5678
  // Handle optional minus sign
  const lines = gerberText.split(/[*\n]/);
  lines.forEach(line => {
    const xMatch = line.match(/X(-?\d+)/);
    const yMatch = line.match(/Y(-?\d+)/);
    
    if (xMatch) {
      const xRaw = parseInt(xMatch[1], 10);
      xCoords.push(xRaw / Math.pow(10, xDecimal));
    }
    if (yMatch) {
      const yRaw = parseInt(yMatch[1], 10);
      yCoords.push(yRaw / Math.pow(10, yDecimal));
    }
  });

  if (xCoords.length === 0 || yCoords.length === 0) return null;

  // 4. Bounding Box calculate (BUG 3)
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  let width = maxX - minX;
  let height = maxY - minY;

  // Convert to mm
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

// Test string
const sampleOutline = `
%MOMM*%
%FSLAX24Y24*%
G01*
X1000Y1000D02*
X5000Y1000D01*
X5000Y4000D01*
X1000Y4000D01*
X1000Y1000D01*
M02*
`;

console.log(parseOutlineDimensions(sampleOutline));
