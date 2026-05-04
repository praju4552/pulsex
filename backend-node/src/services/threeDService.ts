import fs from 'fs';
import { fork, spawn } from 'child_process';
import path from 'path';
import { deepLog } from '../utils/logger';

export interface MeshMetadata {
  volume: number;
  surfaceArea: number;
  width: number;
  height: number;
  depth: number;
  triangleCount: number;
  estimatedPrintTime: number;
}

export class ThreeDService {
  /**
   * Processes a 3D file and extracts metadata.
   * Uses child_process.spawn() for isolation on Hostinger.
   */
  static async getMetadata(filePath: string, fileType: string): Promise<MeshMetadata> {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, 'threeDWorker.js');
      const nodePath = '/opt/alt/alt-nodejs24/root/usr/bin/node';
      deepLog(`[SERVICE] Spawning process for ${filePath} using ${nodePath}`);

      if (!fs.existsSync(workerPath)) {
          deepLog(`[SERVICE] ERROR: Worker file NOT FOUND at ${workerPath}`);
          return reject(new Error('Internal worker script missing'));
      }

      const child = spawn(nodePath, [workerPath], {
          stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdoutData = '';
      child.stdout?.on('data', (data) => {
          stdoutData += data.toString();
          deepLog(`[SERVICE] Spawn STDOUT: ${data.toString()}`);
      });

      child.stderr?.on('data', (data) => {
          deepLog(`[SERVICE] Spawn STDERR: ${data.toString()}`);
      });

      // Send data via stdin since we don't have IPC
      child.stdin?.write(JSON.stringify({ filePath, fileType }) + '\n');
      child.stdin?.end();

      child.on('close', (code) => {
        deepLog(`[SERVICE] Spawn CLOSED with code ${code}`);
        if (code === 0) {
          try {
             const results = JSON.parse(stdoutData.split('\n').filter(line => line.trim()).pop() || '');
             if (results.success) {
               resolve(results.results as MeshMetadata);
             } else {
               reject(new Error(results.error));
             }
          } catch (e) {
             reject(new Error('Failed to parse worker output: ' + stdoutData));
          }
        } else {
          reject(new Error(`Worker process exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        deepLog(`[SERVICE] Spawn error: ${err.message}`);
        reject(err);
      });
    });
  }
}
