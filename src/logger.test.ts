/**
 * Tests for logger.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger, isDebugEnabled } from './logger.js';

describe('logger', () => {
  const originalEnv = process.env.MCP_DEBUG;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (originalEnv === undefined) {
      delete process.env.MCP_DEBUG;
    } else {
      process.env.MCP_DEBUG = originalEnv;
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
    it('should not log when debug is disabled', () => {
      delete process.env.MCP_DEBUG;
      logger.debug('test message');
      logger.info('test message');
      logger.warn('test message');
      logger.error('test message');
      logger.security('test message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log debug messages when enabled', () => {
      process.env.MCP_DEBUG = '1';
      logger.debug('test debug');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('DEBUG');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('test debug');
    });

    it('should log info messages when enabled', () => {
      process.env.MCP_DEBUG = '1';
      logger.info('test info');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('INFO');
    });

    it('should log warn messages when enabled', () => {
      process.env.MCP_DEBUG = '1';
      logger.warn('test warning');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('WARN');
    });

    it('should log error messages when enabled', () => {
      process.env.MCP_DEBUG = '1';
      logger.error('test error');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
    });

    it('should log security events when enabled', () => {
      process.env.MCP_DEBUG = '1';
      logger.security('path traversal attempt');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('SECURITY');
    });

    it('should include context in log messages', () => {
      process.env.MCP_DEBUG = '1';
      logger.security('test', { user: 'attacker', path: '../../../etc/passwd' });
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('attacker');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('../../../etc/passwd');
    });

    it('should include timestamp in log messages', () => {
      process.env.MCP_DEBUG = '1';
      logger.info('test');
      // ISO timestamp format: 2026-01-23T...
      expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    });
  });
});
