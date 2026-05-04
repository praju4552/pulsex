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
// Absolute search path for the Node.js binary on Hostinger
const HOSTINGER_NODE_PATH = '/opt/alt/alt-nodejs24/root/usr/bin/node';
/**
 * Renders Gerber files from a ZIP archive using a background worker process.
 * This isolates the memory-intensive rendering tasks from the main process,
 * preventing 503 errors on shared hosting.
 */
function renderGerberZip(zipBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            // Resolve the worker script path. Note: in production, it will be in the 'dist' folder.
            const workerPath = path_1.default.join(__dirname, 'gerberWorker.js');
            (0, logger_1.deepLog)(`[GERBER-RENDER] Spawning worker at ${workerPath}`);
            // Create the process
            const child = (0, child_process_1.spawn)(HOSTINGER_NODE_PATH, [workerPath]);
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
                if (logLine)
                    (0, logger_1.deepLog)(`[GERBER-WORKER-STDERR] ${logLine}`);
            });
            child.on('error', (err) => {
                (0, logger_1.deepLog)(`[GERBER-RENDER] Spawn Error: ${err.message}`);
                reject(new Error(`Failed to start Gerber rendering worker: ${err.message}`));
            });
            child.on('close', (code) => {
                (0, logger_1.deepLog)(`[GERBER-RENDER] Worker exited with code ${code}`);
                if (code !== 0) {
                    (0, logger_1.deepLog)(`[GERBER-RENDER] FAILED. Stderr: ${stderrData}`);
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
                    }
                    else {
                        reject(new Error(result.error || 'Unknown rendering error'));
                    }
                }
                catch (err) {
                    (0, logger_1.deepLog)(`[GERBER-RENDER] Parse Error: ${stdoutData.slice(0, 100)}...`);
                    reject(new Error('Failed to parse rendering results'));
                }
            });
        });
    });
}
