/**
 * Integration tests for the MCP server.
 * These tests start the actual server and communicate via the MCP protocol.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'node:path';

/** Helper to extract text from MCP tool result */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResultText(result: any): string {
  const content = result.content;
  if (Array.isArray(content)) {
    const textItem = content.find((c: { type?: string }) => c.type === 'text');
    return textItem?.text ?? '';
  }
  return '';
}

describe('MCP Server Integration', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    const serverPath = path.join(import.meta.dirname, '..', 'dist', 'src', 'server.js');

    transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
    });

    client = new Client({ name: 'integration-test', version: '1.0.0' });
    await client.connect(transport);
  }, 30000); // 30s timeout for server startup

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (transport) {
      await transport.close();
    }
  });

  describe('Tool Discovery', () => {
    it('should list all expected tools', async () => {
      const result = await client.listTools();

      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBe(4);

      const toolNames = result.tools.map((t) => t.name);
      expect(toolNames).toContain('get_languages_list');
      expect(toolNames).toContain('get_project_template');
      expect(toolNames).toContain('get_azure_functions_templates_list');
      expect(toolNames).toContain('get_azure_functions_template');
    });

    it('should provide tool descriptions', async () => {
      const result = await client.listTools();

      const languagesTool = result.tools.find((t) => t.name === 'get_languages_list');
      expect(languagesTool).toBeDefined();
      expect(languagesTool?.description).toContain('Azure Functions');
    });
  });

  describe('get_languages_list', () => {
    it('should return language information', async () => {
      const result = await client.callTool({
        name: 'get_languages_list',
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();

      const text = getResultText(result);
      expect(text).toContain('csharp');
      expect(text).toContain('python');
      expect(text).toContain('java');
      expect(text).toContain('typescript');
      expect(text).toContain('Prerequisites');
      expect(text).toContain('Quick Commands');
    });
  });

  describe('get_project_template', () => {
    it('should return Python project template', async () => {
      const result = await client.callTool({
        name: 'get_project_template',
        arguments: { language: 'python' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('host.json');
      expect(text).toContain('local.settings.json');
      expect(text).toContain('requirements.txt');
      expect(text).toContain('Setup Instructions');
    });

    it('should return TypeScript project template', async () => {
      const result = await client.callTool({
        name: 'get_project_template',
        arguments: { language: 'typescript' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('package.json');
      expect(text).toContain('tsconfig.json');
      expect(text).toContain('host.json');
    });

    it('should return Java project template', async () => {
      const result = await client.callTool({
        name: 'get_project_template',
        arguments: { language: 'java' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('pom.xml');
      expect(text).toContain('host.json');
    });

    it('should return error for invalid language', async () => {
      const result = await client.callTool({
        name: 'get_project_template',
        arguments: { language: 'invalid' },
      });

      expect(result.isError).toBe(true);

      const text = getResultText(result);
      expect(text).toContain('invalid');
    });
  });

  describe('get_azure_functions_templates_list', () => {
    it('should return Python templates', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_templates_list',
        arguments: { language: 'python' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('HttpTrigger');
      expect(text).toContain('BlobTrigger');
      expect(text).toContain('TimerTrigger');
      expect(text).toContain('Triggers (pick one)');
      expect(text).toContain('Next Step');
    });

    it('should return error for invalid language', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_templates_list',
        arguments: { language: 'invalid' },
      });

      expect(result.isError).toBe(true);

      const text = getResultText(result);
      expect(text).toContain('invalid');
    });
  });

  describe('get_azure_functions_template', () => {
    it('should return Python HttpTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'python', template: 'HttpTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('Function Template: HttpTrigger');
      expect(text).toContain('function_app.py');
      expect(text).toContain('Function Files');
    });

    it('should return C# HttpTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'csharp', template: 'HttpTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('Function Template: HttpTrigger');
      expect(text).toContain('Function Files');
    });

    it('should return Java HttpTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'java', template: 'HttpTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('Function Template: HttpTrigger');
      expect(text).toContain('Function Files');
    });

    it('should return TypeScript HttpTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'typescript', template: 'HttpTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('Function Template: HttpTrigger');
      expect(text).toContain('Function Files');
    });

    it('should reject invalid template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'python', template: 'InvalidTemplate' },
      });

      expect(result.isError).toBe(true);

      const text = getResultText(result);
      expect(text).toContain('Invalid template');
    });

    it('should include binding configuration for CosmosDB trigger', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'python', template: 'CosmosDBTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('Configuration Requirements');
      expect(text).toContain('CosmosDbConnection');
    });

    it('should include binding configuration for Blob trigger', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'python', template: 'BlobTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('BlobStorageConnection');
    });
  });

  describe('MCPToolTrigger templates', () => {
    it('should return Java MCPToolTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'java', template: 'MCPToolTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('Function Template: MCPToolTrigger');
    });

    it('should return C# MCPToolTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'csharp', template: 'MCPToolTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('Function Template: MCPToolTrigger');
    });

    it('should return TypeScript MCPToolTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'typescript', template: 'MCPToolTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('Function Template: MCPToolTrigger');
    });

    it('should return Python MCPToolTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_template',
        arguments: { language: 'python', template: 'MCPToolTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('Function Template: MCPToolTrigger');
    });
  });
});
