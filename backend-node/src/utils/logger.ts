import fs from 'fs';
import path from 'path';

const logPath = '/home/u655334071/domains/pulsewritexsolutions.com/nodejs/tmp/deep_debug.log';

export const deepLog = (message: string) => {
    try {
        const timestamp = new Date().toISOString();
        const caller = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
        const logLine = `[${timestamp}] [${caller}] ${message}\n`;
        fs.appendFileSync(logPath, logLine);
        console.log(message); // Fallback to stdout
    } catch (e) {
        console.error('DeepLog Failed:', e);
    }
};
