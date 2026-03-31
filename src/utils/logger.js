import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

const logPath = path.join(app.getPath('userData'), 'install.log');

export function log(message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}\n`;

    try {
        fs.appendFileSync(logPath, formattedMessage);
        console.log(formattedMessage.trim());
    } catch (err) {
        console.error('Error writing to log file:', err);
    }
}

export function logError(error) {
    const message = error instanceof Error ? error.stack : String(error);
    log(`ERROR: ${message}`);
}

export function getLogPath() {
    return logPath;
}
