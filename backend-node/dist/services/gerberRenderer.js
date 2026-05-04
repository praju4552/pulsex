"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderGerberZip = renderGerberZip;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
// Use Node 18 — matches the runtime that installed node_modules on Hostinger
// Node 24 is available but packages were compiled/installed with Node 18
const HOSTINGER_NODE_PATH = '/opt/alt/alt-nodejs18/root/usr/bin/node';
const WORKER_TIMEOUT_MS = 60000; // 60 seconds max per render
/**
 * Renders Gerber files from a ZIP archive using a background worker process.
 * This isolates the memory-intensive rendering tasks from the main process,
 * preventing 503 errors on shared hosting.
 */
function renderGerberZip(zipBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const workerPath = path_1.default.join(__dirname, 'gerberWorker.js');
            (0, logger_1.deepLog)(`[GERBER-RENDER] Spawning worker at ${workerPath}`);
            const child = (0, child_process_1.spawn)(HOSTINGER_NODE_PATH, [workerPath]);
            // Accumulate stdout as Buffer chunks to handle large SVG data safely
            const stdoutChunks = [];
            let stderrData = '';
            // 60-second safety timeout
            const timeout = setTimeout(() => {
                child.kill('SIGKILL');
                reject(new Error('Gerber rendering timed out after 60 seconds'));
            }, WORKER_TIMEOUT_MS);
            // Pipe ZIP buffer to worker stdin
            child.stdin.write(zipBuffer);
            child.stdin.end();
            child.stdout.on('data', (chunk) => {
                stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            child.stderr.on('data', (data) => {
                stderrData += data.toString();
                const logLine = data.toString().trim();
                if (logLine)
                    (0, logger_1.deepLog)(`[GERBER-WORKER-STDERR] ${logLine}`);
            });
            child.on('error', (err) => {
                clearTimeout(timeout);
                (0, logger_1.deepLog)(`[GERBER-RENDER] Spawn Error: ${err.message}`);
                reject(new Error(`Failed to start Gerber rendering worker: ${err.message}`));
            });
            child.on('close', (code) => {
                clearTimeout(timeout);
                (0, logger_1.deepLog)(`[GERBER-RENDER] Worker exited with code ${code}`);
                if (code !== 0) {
                    (0, logger_1.deepLog)(`[GERBER-RENDER] FAILED. Stderr: ${stderrData}`);
                    return reject(new Error('Gerber rendering worker failed with exit code ' + code));
                }
                // Reassemble all stdout chunks into one Buffer, then decode
                const fullOutput = Buffer.concat(stdoutChunks).toString('utf8');
                (0, logger_1.deepLog)(`[GERBER-RENDER] stdout bytes received: ${Buffer.concat(stdoutChunks).length}`);
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
                    }
                    else {
                        reject(new Error(result.error || 'Unknown rendering error'));
                    }
                }
                catch (err) {
                    (0, logger_1.deepLog)(`[GERBER-RENDER] JSON Parse Error. First 200 chars: ${fullOutput.slice(0, 200)}`);
                    reject(new Error('Failed to parse Gerber rendering results — output may be truncated'));
                }
            });
        });
    });
}
