const { spawn } = require('child_process');
const path = require('path');

const entry = path.join(
  __dirname,
  'nodejs',
  'backend-node', 
  'dist',
  'app.js'
);

console.log('Starting app from:', entry);

const child = spawn(process.execPath, [entry], {
  stdio: 'inherit',
  env: process.env
});

child.on('error', (err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log('App exited with code:', code);
  process.exit(code);
});
