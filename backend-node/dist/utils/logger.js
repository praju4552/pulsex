"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepLog = void 0;
const fs_1 = __importDefault(require("fs"));
const logPath = '/home/u655334071/domains/pulsewritexsolutions.com/nodejs/tmp/deep_debug.log';
const deepLog = (message) => {
    var _a, _b;
    try {
        const timestamp = new Date().toISOString();
        const caller = ((_b = (_a = new Error().stack) === null || _a === void 0 ? void 0 : _a.split('\n')[2]) === null || _b === void 0 ? void 0 : _b.trim()) || 'unknown';
        const logLine = `[${timestamp}] [${caller}] ${message}\n`;
        fs_1.default.appendFileSync(logPath, logLine);
        console.log(message); // Fallback to stdout
    }
    catch (e) {
        console.error('DeepLog Failed:', e);
    }
};
exports.deepLog = deepLog;
