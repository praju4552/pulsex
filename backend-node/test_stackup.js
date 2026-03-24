const pcbStackup = require('pcb-stackup');
const fs = require('fs');
const { Readable } = require('stream');

async function check() {
  const stream1 = new Readable();
  stream1.push('G01 X0 Y0*\nG01 X100 Y100*\nM02*');
  stream1.push(null);

  const layers = [{ id: 'top_copper', filename: 'top.gtl', gerber: stream1, type: 'copper', side: 'top' }];
  
  const stackup = await pcbStackup(layers, { id: 'test_id' });
  fs.writeFileSync('svg_out.txt', stackup.top.svg);
  console.log("Written output to svg_out.txt");
}

check();
