/**
 * Tests for logger.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger, isDebugEnabled } from './logger.js';

describe('logger', () => {
  const originalDebugEnv = process.env.MCP_DEBUG;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (originalDebugEnv === undefined) {
      delete process.env.MCP_DEBUG;
    } else {
      process.env.MCP_DEBUG = originalDebugEnv;
    }
  });

  describe('isDebugEnabled', () => {
    it('should return false when MCP_DEBUG is not set', () => {
      delete process.env.MCP_DEBUG;
      expect(isDebugEnabled()).toBe(false);
    });

    it('should return true when MCP_DEBUG is "1"', () => {
      process.env.MCP_DEBUG = '1';
      expect(isDebugEnabled()).toBe(true);
    });

    it('should return true when MCP_DEBUG is "true"', () => {
      process.env.MCP_DEBUG = 'true';
      expect(isDebugEnabled()).toBe(true);
    });

    it('should return false for other values', () => {
      process.env.MCP_DEBUG = 'yes';
      expect(isDebugEnabled()).toBe(false);
    });
  });

  describe('logging functions', () => {
    it('should not log debug/info when debug is disabled', () => {
      delete process.env.MCP_DEBUG;
      logger.debug('test message');
      logger.info('test message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should always log warn/error/security even when debug is disabled', () => {
      delete process.env.MCP_DEBUG;
      logger.warn('test warning');
      logger.error('test error');
      logger.security('test security');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    });

    it('should log debug messages when enabled', () => {
      process.env.MCP_DEBUG = '1';
      logger.debug('test debug');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.level).toBe('debug');
      expect(output.message).toBe('test debug');
    });

    it('should log info messages when enabled', () => {
      process.env.MCP_DEBUG = '1';
      logger.info('test info');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.level).toBe('info');
    });

    it('should always log warn messages', () => {
      delete process.env.MCP_DEBUG;
      logger.warn('test warning');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.level).toBe('warn');
    });

    it('should always log error messages', () => {
      delete process.env.MCP_DEBUG;
      logger.error('test error');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.level).toBe('error');
    });

    it('should always log security events', () => {
      delete process.env.MCP_DEBUG;
      logger.security('path traversal attempt');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.level).toBe('security');
    });

    it('should include context in log messages', () => {
      process.env.MCP_DEBUG = '1';
      logger.security('test', { user: 'attacker', path: '../../../etc/passwd' });
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('attacker');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('../../../etc/passwd');
    });
  });

  describe('JSON output format', () => {
    beforeEach(() => {
      process.env.MCP_DEBUG = '1';
    });

    it('should output valid JSON', () => {
      logger.warn('test warning');
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should include timestamp, level, and message', () => {
      logger.error('error occurred');
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output).toHaveProperty('timestamp');
      expect(output.level).toBe('error');
      expect(output.message).toBe('error occurred');
    });

    it('should include context when provided', () => {
      logger.security('path traversal', { path: '../etc/passwd', ip: '127.0.0.1' });
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.context).toEqual({ path: '../etc/passwd', ip: '127.0.0.1' });
    });

    it('should not include context when not provided', () => {
      logger.info('simple message');
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output).not.toHaveProperty('context');
    });

    it('should format timestamp as ISO 8601', () => {
      logger.debug('test');
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should use lowercase level names', () => {
      logger.warn('test');
      const output = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(output.level).toBe('warn');
    });
  });
});
