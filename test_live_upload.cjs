const fs = require('fs');
const https = require('https');

const filePath = 'C:/Users/prajw/Downloads/LCSampleGerber (1).zip';
const fileData = fs.readFileSync(filePath);
const boundary = '----FormBoundary' + Date.now();

const header = '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="gerberFile"; filename="test.zip"\r\n' +
  'Content-Type: application/zip\r\n\r\n';

const footer = '\r\n--' + boundary + '--\r\n';
const fullBody = Buffer.concat([Buffer.from(header), fileData, Buffer.from(footer)]);

const options = {
  hostname: 'api.pulsewritexsolutions.com',
  path: '/api/pcb/parse-gerber',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': fullBody.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const j = JSON.parse(data);
      console.log('dimX:', j.parsedSpec?.dimX);
      console.log('dimY:', j.parsedSpec?.dimY);
      console.log('confidence:', j.analysis?.confidence);
      console.log('warnings:', JSON.stringify(j.analysis?.warnings, null, 2));
      console.log('FULL RESPONSE:', JSON.stringify(j, null, 2));
    } catch(e) {
      console.log('Raw:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(fullBody);
req.end();
