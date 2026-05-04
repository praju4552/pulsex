const { Client } = require('ssh2'); 
const c = new Client(); 

c.on('ready', () => {
  // MySQL query to add the missing Proto FR-4 key without backticks around 'key', because 'key' is a reserved word but MySQL usually allows it if strictly configured, let's just quote it or avoid backticks.
  // We can write it to a file via base64 to avoid ALL bash escaping issues!
  const query = "UPDATE PricingConfig SET value = JSON_SET(value, '$.materialMult.\"Proto FR-4\"', 1.0) WHERE `key` = 'pcb_pricing';";
  
  const b64 = Buffer.from(query).toString('base64');
  
  c.exec(`echo "${b64}" | base64 -d > update_pricing.sql && mysql -u u655334071_pulsex -pPulseXPass2025! u655334071_pulsexdatabase < update_pricing.sql && rm update_pricing.sql && echo "MySQL UPDATE EXECUTED"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('MySQL Output:', out);
      c.end();
    });
  });
}).connect({ 
  host:'82.198.227.43', 
  port:65002, 
  username:'u655334071', 
  password:'EdmalaB@2025' 
});
