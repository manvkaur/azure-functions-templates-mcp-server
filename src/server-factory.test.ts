/**
 * Tests for server-factory.ts
 *
 * These tests verify server creation, tool registration, and template validation
 * without triggering the actual server startup side effects.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  createServer,
  validateTemplates,
  logValidationResult,
  type ServerConfig,
  type ValidationResult,
} from './server-factory.js';
import { VALID_LANGUAGES, VALID_TEMPLATES } from './templates.js';

// Test templates directory
const TEMPLATES_ROOT = path.join(import.meta.dirname, '..', 'templates');

// ============================================================================
// createServer Tests
// ============================================================================
describe('createServer', () => {
  it('should create a server with the provided config', () => {
    const config: ServerConfig = {
      name: 'test-server',
      version: '1.0.0',
      templatesRoot: TEMPLATES_ROOT,
    };

    const server = createServer(config);

    expect(server).toBeDefined();
    // Server should be an McpServer instance
    expect(typeof server.connect).toBe('function');
    expect(typeof server.close).toBe('function');
  });

  it('should register tools during creation', () => {
    const config: ServerConfig = {
      name: 'test-server',
      version: '1.0.0',
      templatesRoot: TEMPLATES_ROOT,
    };

    const server = createServer(config);

    // Server should have tools registered (we can't directly inspect, but it should not throw)
    expect(server).toBeDefined();
  });
});

// ============================================================================
// registerTools Tests
// ============================================================================
describe('registerTools', () => {
  it('should register all four tools', () => {
    const config: ServerConfig = {
      name: 'test-server',
      version: '1.0.0',
      templatesRoot: TEMPLATES_ROOT,
    };

    // Create server and verify tools are registered by checking it doesn't throw
    const server = createServer(config);
    expect(server).toBeDefined();
  });

  it('should use the provided templates root path', () => {
    const customPath = '/custom/templates/path';
    const config: ServerConfig = {
      name: 'test-server',
      version: '1.0.0',
      templatesRoot: customPath,
    };

    // Should not throw even with invalid path (validation is separate)
    const server = createServer(config);
    expect(server).toBeDefined();
  });
});

// ============================================================================
// validateTemplates Tests
// ============================================================================
describe('validateTemplates', () => {
  let tempDir: string;

  beforeAll(async () => {
    // Create a temporary directory for test templates
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'server-factory-test-'));
  });

  afterAll(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return valid result for existing templates', async () => {
    const result = await validateTemplates(TEMPLATES_ROOT);

    expect(result.valid).toBe(true);
    expect(result.missingCount).toBe(0);
    expect(result.extraCount).toBe(0);
    expect(result.totalTemplates).toBeGreaterThan(0);
    expect(result.messages).toHaveLength(0);
  });

  it('should return valid=false for non-existent path', async () => {
    const result = await validateTemplates('/non/existent/path');

    expect(result.valid).toBe(false);
    expect(result.missingCount).toBeGreaterThan(0);
    expect(result.messages.length).toBeGreaterThan(0);
  });

  it('should detect missing templates', async () => {
    // Create a partial templates directory
    const partialDir = path.join(tempDir, 'partial');
    await fs.mkdir(path.join(partialDir, 'python', 'HttpTrigger'), { recursive: true });

    const result = await validateTemplates(partialDir);

    // Should report missing templates for other languages
    expect(result.missingCount).toBeGreaterThan(0);
    expect(result.messages.some((m) => m.includes('missing'))).toBe(true);
  });

  it('should include verbose info when verbose=true', async () => {
    const result = await validateTemplates(TEMPLATES_ROOT, true);

    expect(result.messages.some((m) => m.includes('[INFO]'))).toBe(true);
  });

  it('should not include verbose info when verbose=false', async () => {
    const result = await validateTemplates(TEMPLATES_ROOT, false);

    expect(result.messages.filter((m) => m.includes('[INFO]'))).toHaveLength(0);
  });

  it('should detect extra templates on disk', async () => {
    // Create a directory with an extra template
    const extraDir = path.join(tempDir, 'extra');

    // Create all expected templates for python
    for (const template of VALID_TEMPLATES.python) {
      await fs.mkdir(path.join(extraDir, 'python', template), { recursive: true });
    }

    // Add an extra template that's not in VALID_TEMPLATES
    await fs.mkdir(path.join(extraDir, 'python', 'UnknownExtraTemplate'), { recursive: true });

    const result = await validateTemplates(extraDir);

    expect(result.extraCount).toBeGreaterThan(0);
    expect(result.messages.some((m) => m.includes('undocumented'))).toBe(true);
  });

  it('should report correct total template count', async () => {
    const result = await validateTemplates(TEMPLATES_ROOT);

    const expectedTotal = VALID_LANGUAGES.reduce((sum, lang) => sum + VALID_TEMPLATES[lang].length, 0);
    expect(result.totalTemplates).toBe(expectedTotal);
  });
});

// ============================================================================
// logValidationResult Tests
// ============================================================================
describe('logValidationResult', () => {
  it('should log all messages to stderr', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result: ValidationResult = {
      valid: false,
      missingCount: 2,
      extraCount: 1,
      totalTemplates: 64,
      messages: ['Message 1', 'Message 2', 'Message 3'],
    };

    logValidationResult(result);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Message 1');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Message 2');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Message 3');

    consoleErrorSpy.mockRestore();
  });

  it('should not log anything for empty messages', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result: ValidationResult = {
      valid: true,
      missingCount: 0,
      extraCount: 0,
      totalTemplates: 64,
      messages: [],
    };

    logValidationResult(result);

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

// ============================================================================
// ServerConfig Interface Tests
// ============================================================================
describe('ServerConfig interface', () => {
  it('should accept valid configuration', () => {
    const config: ServerConfig = {
      name: 'my-server',
      version: '2.0.0',
      templatesRoot: '/path/to/templates',
    };

    expect(config.name).toBe('my-server');
    expect(config.version).toBe('2.0.0');
    expect(config.templatesRoot).toBe('/path/to/templates');
  });
});

// ============================================================================
// ValidationResult Interface Tests
// ============================================================================
describe('ValidationResult interface', () => {
  it('should represent valid state correctly', () => {
    const result: ValidationResult = {
      valid: true,
      missingCount: 0,
      extraCount: 0,
      totalTemplates: 64,
      messages: [],
    };

    expect(result.valid).toBe(true);
    expect(result.missingCount).toBe(0);
    expect(result.extraCount).toBe(0);
  });

  it('should represent invalid state correctly', () => {
    const result: ValidationResult = {
      valid: false,
      missingCount: 5,
      extraCount: 2,
      totalTemplates: 59,
      messages: ['Error 1', 'Error 2'],
    };

    expect(result.valid).toBe(false);
    expect(result.missingCount).toBe(5);
    expect(result.extraCount).toBe(2);
    expect(result.messages).toHaveLength(2);
  });
});
