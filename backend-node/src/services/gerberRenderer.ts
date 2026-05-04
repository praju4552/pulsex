import { spawn } from 'child_process';
import path from 'path';
import { deepLog } from '../utils/logger';

// Absolute search path for the Node.js binary on Hostinger
const HOSTINGER_NODE_PATH = '/opt/alt/alt-nodejs24/root/usr/bin/node';

export interface RenderedGerber {
  topSvg: string;
  bottomSvg: string;
  layers: Array<{
    filename: string;
    id: string;
    type: string;
    side: string;
    svg: string;
  }>;
  boardWidth: number;
  boardHeight: number;
  boardUnits: string;
}

/**
 * Renders Gerber files from a ZIP archive using a background worker process.
 * This isolates the memory-intensive rendering tasks from the main process,
 * preventing 503 errors on shared hosting.
 */
export async function renderGerberZip(zipBuffer: Buffer): Promise<RenderedGerber> {
  return new Promise((resolve, reject) => {
    // Resolve the worker script path. Note: in production, it will be in the 'dist' folder.
    const workerPath = path.join(__dirname, 'gerberWorker.js');
    
    deepLog(`[GERBER-RENDER] Spawning worker at ${workerPath}`);

    // Create the process
    const child = spawn(HOSTINGER_NODE_PATH, [workerPath]);

    let stdoutData = '';
    let stderrData = '';

    // Pipe the ZIP buffer to the worker's stdin
    child.stdin.write(zipBuffer);
    child.stdin.end();

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
      // Also log stderr to deep debug via process
      const logLine = data.toString().trim();
      if (logLine) deepLog(`[GERBER-WORKER-STDERR] ${logLine}`);
    });

    child.on('error', (err) => {
      deepLog(`[GERBER-RENDER] Spawn Error: ${err.message}`);
      reject(new Error(`Failed to start Gerber rendering worker: ${err.message}`));
    });

    child.on('close', (code) => {
      deepLog(`[GERBER-RENDER] Worker exited with code ${code}`);
      
      if (code !== 0) {
          deepLog(`[GERBER-RENDER] FAILED. Stderr: ${stderrData}`);
          return reject(new Error('Gerber rendering worker failed with exit code ' + code));
      }

      try {
        const result = JSON.parse(stdoutData);
        if (result.success) {
          resolve({
            topSvg: result.topSvg,
            bottomSvg: result.bottomSvg,
            layers: result.layers,
            boardWidth: result.boardWidth,
            boardHeight: result.boardHeight,
            boardUnits: result.boardUnits || 'mm',
          });
        } else {
          reject(new Error(result.error || 'Unknown rendering error'));
        }
      } catch (err) {
        deepLog(`[GERBER-RENDER] Parse Error: ${stdoutData.slice(0, 100)}...`);
        reject(new Error('Failed to parse rendering results'));
      }
    });
  });
}
