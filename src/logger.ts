/**
 * Simple logger for debugging and security monitoring.
 *
 * Enable debug logging by setting the environment variable:
 *   MCP_DEBUG=1 or MCP_DEBUG=true
 *
 * Security events are always logged to stderr when debug mode is enabled.
 */

const DEBUG_ENV_VAR = 'MCP_DEBUG';

/**
 * Check if debug mode is enabled via environment variable.
 */
export function isDebugEnabled(): boolean {
  const value = process.env[DEBUG_ENV_VAR];
  return value === '1' || value === 'true';
}

/**
 * Log levels for categorizing messages.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';

/**
 * Format a log message with timestamp and level.
 */
function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase().padEnd(8);
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${levelStr}] ${message}${contextStr}`;
}

/**
 * Log a debug message (only when debug mode is enabled).
 */
export function debug(message: string, context?: Record<string, unknown>): void {
  if (isDebugEnabled()) {
    console.error(formatMessage('debug', message, context));
  }
}

/**
 * Log an info message (only when debug mode is enabled).
 */
export function info(message: string, context?: Record<string, unknown>): void {
  if (isDebugEnabled()) {
    console.error(formatMessage('info', message, context));
  }
}

/**
 * Log a warning message (only when debug mode is enabled).
 */
export function warn(message: string, context?: Record<string, unknown>): void {
  if (isDebugEnabled()) {
    console.error(formatMessage('warn', message, context));
  }
}

/**
 * Log an error message (only when debug mode is enabled).
 */
export function error(message: string, context?: Record<string, unknown>): void {
  if (isDebugEnabled()) {
    console.error(formatMessage('error', message, context));
  }
}

/**
 * Log a security event (only when debug mode is enabled).
 * Use this for path traversal attempts, invalid inputs, etc.
 */
export function security(message: string, context?: Record<string, unknown>): void {
  if (isDebugEnabled()) {
    console.error(formatMessage('security', message, context));
  }
}

/**
 * Logger namespace for convenient import.
 */
export const logger = {
  isDebugEnabled,
  debug,
  info,
  warn,
  error,
  security,
};
