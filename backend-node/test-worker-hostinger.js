const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  console.log('Main thread starting worker...');
  const worker = new Worker(__filename);
  worker.on('message', (msg) => {
    console.log('Main thread received:', msg);
    process.exit(0);
  });
  worker.on('error', (err) => {
    console.error('Worker error:', err);
    process.exit(1);
  });
  worker.on('exit', (code) => {
    if (code !== 0) console.error('Worker exit code:', code);
  });
  
  // Timeout if it takes too long
  setTimeout(() => {
    console.error('Worker test timed out after 5s');
    process.exit(1);
  }, 5000);
} else {
  parentPort.postMessage('Hello from worker!');
}
