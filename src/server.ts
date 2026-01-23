#!/usr/bin/env node

/**
 * Azure Functions Templates MCP Server - Entry Point
 *
 * This is the main entry point that starts the MCP server.
 * Server configuration and tool registration are in server-factory.ts for testability.
 */

// Check Node.js version before any other imports
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeVersion < 18) {
  console.error(`Error: Node.js 18 or higher is required. Current version: ${process.versions.node}`);
  process.exit(1);
}

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createServer, validateTemplates, logValidationResult } from './server-factory.js';

// Templates are packaged with this server
// When running from dist/, templates folder is at package root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(__dirname, '..', '..', 'templates');

// Read version from package.json to keep it in sync
const require = createRequire(import.meta.url);
const packageJson = require('../../package.json');

async function main() {
  // Validate templates exist before starting server
  const verbose = process.env.MCP_VERBOSE === 'true' || process.env.MCP_VERBOSE === '1';
  const validationResult = await validateTemplates(TEMPLATES_ROOT, verbose);
  logValidationResult(validationResult);

  // Create and configure the server
  const server = createServer({
    name: packageJson.name,
    version: packageJson.version,
    templatesRoot: TEMPLATES_ROOT,
  });

  // Connect to transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.error(`[INFO] Received ${signal}, shutting down gracefully...`);
    try {
      await server.close();
      console.error('[INFO] Server closed successfully');
      process.exit(0);
    } catch (err) {
      console.error('[ERROR] Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  // Write errors to stderr only. Never write to stdout in stdio servers.
  console.error(err);
  process.exit(1);
});
