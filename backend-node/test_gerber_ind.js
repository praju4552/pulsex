const gerberToSvg = require('gerber-to-svg');
const { Readable } = require('stream');
const fs = require('fs');

async function check() {
  const s1 = new Readable(); s1.push('G01 X10 Y10*\nG01 X50 Y50*\nM02*'); s1.push(null);
  
  let svg = '';
  const conv = gerberToSvg(s1);
  conv.on('data', chunk => svg += chunk);
  conv.on('end', () => {
    fs.writeFileSync('gerber_svg_ind.txt', svg);
    console.log("Done");
  });
}

check();
