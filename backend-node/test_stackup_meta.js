const pcbStackup = require('pcb-stackup');
const { Readable } = require('stream');

async function check() {
  const s1 = new Readable(); s1.push('G01 X0 Y0*\nG01 X100 Y100*\nM02*'); s1.push(null);
  const layers = [{ id: 'top_copper', filename: 'top.gtl', gerber: s1, type: 'copper', side: 'top' }];
  
  const stackup = await pcbStackup(layers);
  console.log("Top Properties:", Object.keys(stackup.top));
  console.log("Units:", stackup.top.units);
  if(stackup.top.viewBox) console.log("ViewBox:", stackup.top.viewBox);
  // Also dump stackup.top object itself
  fs = require('fs');
  fs.writeFileSync('stackup_dump.json', JSON.stringify(stackup.top, null, 2));
}

check();
