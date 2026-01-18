/**
 * Production Logger Utility
 * 
 * Provides structured logging for monitoring app health in production.
 * Logs are visible in:
 * - Development: Browser console + terminal
 * - Production (Vercel): Dashboard → Project → Logs tab
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogMetadata {
    userId?: string;
    sessionId?: string;
    wordId?: string;
    xpChange?: number;
    [key: string]: any;
}

function formatLog(level: LogLevel, context: string, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${level}] ${context}: ${message}${metaStr}`;
}

export const logger = {
    /**
     * Log informational messages (e.g., "User completed session")
     */
    info: (context: string, message: string, metadata?: LogMetadata) => {
        const log = formatLog('INFO', context, message, metadata);
        console.info(log);
    },

    /**
     * Log warnings (e.g., "User has 0 XP after update")
     */
    warn: (context: string, message: string, metadata?: LogMetadata) => {
        const log = formatLog('WARN', context, message, metadata);
        console.warn(log);
    },

    /**
     * Log errors (e.g., "Failed to update XP")
     */
    error: (context: string, message: string, error?: any, metadata?: LogMetadata) => {
        const log = formatLog('ERROR', context, message, metadata);
        console.error(log, error);
    }
};
