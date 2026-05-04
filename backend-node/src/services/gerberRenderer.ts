import { spawn } from 'child_process';
import path from 'path';
import { deepLog } from '../utils/logger';

// Use Node 18 — matches the runtime that installed node_modules on Hostinger
// Node 24 is available but packages were compiled/installed with Node 18
const HOSTINGER_NODE_PATH = '/opt/alt/alt-nodejs18/root/usr/bin/node';
const WORKER_TIMEOUT_MS = 60_000; // 60 seconds max per render

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
    const workerPath = path.join(__dirname, 'gerberWorker.js');
    deepLog(`[GERBER-RENDER] Spawning worker at ${workerPath}`);

    const child = spawn(HOSTINGER_NODE_PATH, [workerPath]);

    // Accumulate stdout as Buffer chunks to handle large SVG data safely
    const stdoutChunks: Buffer[] = [];
    let stderrData = '';

    // 60-second safety timeout
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Gerber rendering timed out after 60 seconds'));
    }, WORKER_TIMEOUT_MS);

    // Pipe ZIP buffer to worker stdin
    child.stdin.write(zipBuffer);
    child.stdin.end();

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    child.stderr.on('data', (data: Buffer) => {
      stderrData += data.toString();
      const logLine = data.toString().trim();
      if (logLine) deepLog(`[GERBER-WORKER-STDERR] ${logLine}`);
    });

    child.on('error', (err: Error) => {
      clearTimeout(timeout);
      deepLog(`[GERBER-RENDER] Spawn Error: ${err.message}`);
      reject(new Error(`Failed to start Gerber rendering worker: ${err.message}`));
    });

    child.on('close', (code: number | null) => {
      clearTimeout(timeout);
      deepLog(`[GERBER-RENDER] Worker exited with code ${code}`);

      if (code !== 0) {
        deepLog(`[GERBER-RENDER] FAILED. Stderr: ${stderrData}`);
        return reject(new Error('Gerber rendering worker failed with exit code ' + code));
      }

      // Reassemble all stdout chunks into one Buffer, then decode
      const fullOutput = Buffer.concat(stdoutChunks).toString('utf8');
      deepLog(`[GERBER-RENDER] stdout bytes received: ${Buffer.concat(stdoutChunks).length}`);

      try {
        const result = JSON.parse(fullOutput);
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
        deepLog(`[GERBER-RENDER] JSON Parse Error. First 200 chars: ${fullOutput.slice(0, 200)}`);
        reject(new Error('Failed to parse Gerber rendering results — output may be truncated'));
      }
    });
  });
}
