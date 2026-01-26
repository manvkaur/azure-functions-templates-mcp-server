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
      expect(result.tools.length).toBeGreaterThanOrEqual(3);

      const toolNames = result.tools.map((t) => t.name);
      expect(toolNames).toContain('get_azure_functions_templates');
      expect(toolNames).toContain('get_supported_languages');
      expect(toolNames).toContain('get_templates_by_language');
      expect(toolNames).toContain('get_template_files');
    });

    it('should provide tool descriptions', async () => {
      const result = await client.listTools();

      const mainTool = result.tools.find((t) => t.name === 'get_azure_functions_templates');
      expect(mainTool).toBeDefined();
      expect(mainTool?.description).toContain('Azure Functions');
      expect(mainTool?.inputSchema).toBeDefined();
    });
  });

  describe('get_supported_languages', () => {
    it('should return language information', async () => {
      const result = await client.callTool({
        name: 'get_supported_languages',
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      expect(result.content).toBeDefined();

      const text = getResultText(result);
      expect(text).toContain('csharp');
      expect(text).toContain('python');
      expect(text).toContain('java');
      expect(text).toContain('typescript');
    });
  });

  describe('get_templates_by_language', () => {
    it('should return Python templates', async () => {
      const result = await client.callTool({
        name: 'get_templates_by_language',
        arguments: { language: 'python' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('HttpTrigger');
      expect(text).toContain('BlobTrigger');
      expect(text).toContain('TimerTrigger');
    });

    it('should return error for invalid language', async () => {
      const result = await client.callTool({
        name: 'get_templates_by_language',
        arguments: { language: 'invalid' },
      });

      expect(result.isError).toBe(true);

      const text = getResultText(result);
      // Zod validation returns "invalid_enum_value" error
      expect(text).toContain('invalid');
    });
  });

  describe('get_azure_functions_templates', () => {
    it('should return Python HttpTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_templates',
        arguments: { language: 'python', template: 'HttpTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('function_app.py');
      expect(text).toContain('host.json');
      expect(text).toContain('requirements.txt');
    });

    it('should return specific file when filePath provided', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_templates',
        arguments: {
          language: 'python',
          template: 'HttpTrigger',
          filePath: 'function_app.py',
        },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('import azure.functions as func');
      expect(text).toContain('@app.route');
    });

    it('should reject invalid template', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_templates',
        arguments: { language: 'python', template: 'InvalidTemplate' },
      });

      expect(result.isError).toBe(true);

      const text = getResultText(result);
      expect(text).toContain('Invalid template');
    });

    it('should reject path traversal attempts', async () => {
      const result = await client.callTool({
        name: 'get_azure_functions_templates',
        arguments: {
          language: 'python',
          template: 'HttpTrigger',
          filePath: '../../../etc/passwd',
        },
      });

      expect(result.isError).toBe(true);

      const text = getResultText(result);
      expect(text).toContain('path traversal');
    });
  });

  describe('get_template_files', () => {
    it('should return complete template with all files', async () => {
      const result = await client.callTool({
        name: 'get_template_files',
        arguments: { language: 'python', template: 'HttpTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      // Should contain full file contents, not just listing
      expect(text).toContain('```python');
      expect(text).toContain('import azure.functions as func');
      expect(text).toContain('Template Ready for Use');
    });

    it('should return C# template with .cs files', async () => {
      const result = await client.callTool({
        name: 'get_template_files',
        arguments: { language: 'csharp', template: 'HttpTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('```csharp');
      expect(text).toContain('namespace');
    });

    it('should return Java template with .java files', async () => {
      const result = await client.callTool({
        name: 'get_template_files',
        arguments: { language: 'java', template: 'HttpTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('```java');
      expect(text).toContain('pom.xml');
    });

    it('should return Java BlobTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_template_files',
        arguments: { language: 'java', template: 'BlobTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('```java');
      expect(text).toContain('@BlobTrigger');
    });

    it('should return Java TimerTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_template_files',
        arguments: { language: 'java', template: 'TimerTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('```java');
      expect(text).toContain('@TimerTrigger');
    });

    it('should return Java MCPToolTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_template_files',
        arguments: { language: 'java', template: 'MCPToolTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('```java');
      expect(text).toContain('@McpToolTrigger');
      expect(text).toContain('McpToolInvocationContext');
      expect(text).toContain('pom.xml');
    });

    it('should return C# MCPToolTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_template_files',
        arguments: { language: 'csharp', template: 'MCPToolTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('```csharp');
      expect(text).toContain('McpToolTrigger');
      expect(text).toContain('ToolInvocationContext');
      expect(text).toContain('Program.cs');
    });

    it('should return TypeScript MCPToolTrigger template', async () => {
      const result = await client.callTool({
        name: 'get_template_files',
        arguments: { language: 'typescript', template: 'MCPToolTrigger' },
      });

      expect(result.isError).toBeFalsy();

      const text = getResultText(result);
      expect(text).toContain('```typescript');
      expect(text).toContain('app.mcpTool');
      expect(text).toContain('package.json');
      expect(text).toContain('tsconfig.json');
    });
  });
});
