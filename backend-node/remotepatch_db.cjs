const { Client } = require('ssh2'); 
const c = new Client(); 

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const record = await prisma.pricingConfig.findUnique({ where: { key: 'pcb_pricing' } });
  if (record && record.value) {
    const val = record.value;
    if (val.materialMult['Proto FR-4'] === undefined) {
      val.materialMult['Proto FR-4'] = 1.0;
      await prisma.pricingConfig.update({
        where: { key: 'pcb_pricing' },
        data: { value: val }
      });
      console.log('Successfully added Proto FR-4 to remote DB!');
    } else {
      console.log('Already exists in remote DB. Value:', val.materialMult['Proto FR-4']);
    }
  } else {
    console.log('pcb_pricing not found in DB!');
  }
}
main()
  .then(() => {
    // Adding timeout to prevent Rust panics on immediate context teardown
    setTimeout(() => {
      prisma.$disconnect().then(() => process.exit(0));
    }, 2000);
  })
  .catch(err => {
    console.error(err);
    setTimeout(() => {
      prisma.$disconnect().then(() => process.exit(1));
    }, 2000);
  });
`;

c.on('ready', () => {
  console.log('SSH connection established. Uploading and executing remote patch script...');
  // Use a string literal directly instead of HEREDOC to avoid escaping issues
  const b64 = Buffer.from(scriptContent).toString('base64');
  c.exec(`cd /home/u655334071/domains/pulsewritexsolutions.com/backendnode && echo "${b64}" | base64 -d > patch_pcb_db.js && /opt/alt/alt-nodejs24/root/usr/bin/node patch_pcb_db.js`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Remote Execution Result:');
      console.log(out);
      c.end();
    });
  });
}).connect({ 
  host:'82.198.227.43', 
  port:65002, 
  username:'u655334071', 
  password:'EdmalaB@2025' 
});
