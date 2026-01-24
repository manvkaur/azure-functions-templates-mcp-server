/**
 * Logger for MCP server.
 * - debug/info: Only logged when MCP_DEBUG=1 or MCP_DEBUG=true
 * - warn/error/security: Always logged to stderr
 */

const DEBUG_ENV_VAR = 'MCP_DEBUG';

export function isDebugEnabled(): boolean {
  const value = process.env[DEBUG_ENV_VAR];
  return value === '1' || value === 'true';
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security';

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const levelStr = level.toUpperCase().padEnd(8);
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${levelStr}] ${message}${contextStr}`;
}

export function debug(message: string, context?: Record<string, unknown>): void {
  if (isDebugEnabled()) {
    console.error(formatMessage('debug', message, context));
  }
}

export function info(message: string, context?: Record<string, unknown>): void {
  if (isDebugEnabled()) {
    console.error(formatMessage('info', message, context));
  }
}

/** Warning messages - always logged to stderr */
export function warn(message: string, context?: Record<string, unknown>): void {
  console.error(formatMessage('warn', message, context));
}

/** Error messages - always logged to stderr */
export function error(message: string, context?: Record<string, unknown>): void {
  console.error(formatMessage('error', message, context));
}

/** Security events (path traversal attempts, invalid inputs) - always logged to stderr */
export function security(message: string, context?: Record<string, unknown>): void {
  console.error(formatMessage('security', message, context));
}

export const logger = {
  isDebugEnabled,
  debug,
  info,
  warn,
  error,
  security,
};
