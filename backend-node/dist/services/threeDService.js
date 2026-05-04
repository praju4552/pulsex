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
exports.ThreeDService = void 0;
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
class ThreeDService {
    /**
     * Processes a 3D file and extracts metadata.
     * Uses child_process.spawn() for isolation on Hostinger.
     */
    static getMetadata(filePath, fileType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var _a, _b, _c, _d;
                const workerPath = path_1.default.join(__dirname, 'threeDWorker.js');
                const nodePath = '/opt/alt/alt-nodejs24/root/usr/bin/node';
                (0, logger_1.deepLog)(`[SERVICE] Spawning process for ${filePath} using ${nodePath}`);
                if (!fs_1.default.existsSync(workerPath)) {
                    (0, logger_1.deepLog)(`[SERVICE] ERROR: Worker file NOT FOUND at ${workerPath}`);
                    return reject(new Error('Internal worker script missing'));
                }
                const child = (0, child_process_1.spawn)(nodePath, [workerPath], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                let stdoutData = '';
                (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
                    stdoutData += data.toString();
                    (0, logger_1.deepLog)(`[SERVICE] Spawn STDOUT: ${data.toString()}`);
                });
                (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => {
                    (0, logger_1.deepLog)(`[SERVICE] Spawn STDERR: ${data.toString()}`);
                });
                // Send data via stdin since we don't have IPC
                (_c = child.stdin) === null || _c === void 0 ? void 0 : _c.write(JSON.stringify({ filePath, fileType }) + '\n');
                (_d = child.stdin) === null || _d === void 0 ? void 0 : _d.end();
                child.on('close', (code) => {
                    (0, logger_1.deepLog)(`[SERVICE] Spawn CLOSED with code ${code}`);
                    if (code === 0) {
                        try {
                            const results = JSON.parse(stdoutData.split('\n').filter(line => line.trim()).pop() || '');
                            if (results.success) {
                                resolve(results.results);
                            }
                            else {
                                reject(new Error(results.error));
                            }
                        }
                        catch (e) {
                            reject(new Error('Failed to parse worker output: ' + stdoutData));
                        }
                    }
                    else {
                        reject(new Error(`Worker process exited with code ${code}`));
                    }
                });
                child.on('error', (err) => {
                    (0, logger_1.deepLog)(`[SERVICE] Spawn error: ${err.message}`);
                    reject(err);
                });
            });
        });
    }
}
exports.ThreeDService = ThreeDService;
