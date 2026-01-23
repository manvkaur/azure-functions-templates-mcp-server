#!/usr/bin/env node

// Check Node.js version before any other imports
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeVersion < 18) {
  console.error(`Error: Node.js 18 or higher is required. Current version: ${process.versions.node}`);
  process.exit(1);
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  validateTemplatesExist,
  discoverTemplates,
  VALID_LANGUAGES,
  VALID_TEMPLATES,
  generateTemplateDescriptions,
  type ValidLanguage,
} from './templates.js';
import {
  handleGetTemplates,
  handleGetSupportedLanguages,
  handleGetTemplatesByLanguage,
  handleGetTemplateFiles,
} from './handlers.js';

// Templates are packaged with this server
// When running from dist/, templates folder is at package root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(__dirname, '..', '..', 'templates');

// Read version from package.json to keep it in sync
const require = createRequire(import.meta.url);
const packageJson = require('../../package.json');

const server = new McpServer({
  name: packageJson.name,
  version: packageJson.version,
});

// Single comprehensive tool for Azure Functions templates
server.registerTool(
  'get_azure_functions_templates',
  {
    title: 'Get Azure Functions Template',
    description: `Get complete Azure Functions templates with all files for rapid development and deployment.

Ready-to-use templates across ${VALID_LANGUAGES.length} languages with complete project structure:

 **C# (.NET Isolated)**: ${VALID_TEMPLATES.csharp.length} templates including Durable Functions, Dapr integration, database bindings
 **Java (Maven)**: ${VALID_TEMPLATES.java.length} templates with annotation-based configuration and Maven project structure  
 **Python (v2 Model)**: ${VALID_TEMPLATES.python.length} templates using modern decorator-based programming model
 **TypeScript (Node.js)**: ${VALID_TEMPLATES.typescript.length} templates with full type safety and modern async patterns

**Template Categories**:
- **Web APIs**: HTTP triggers for REST APIs and webhooks
- **Storage**: Blob triggers/bindings, Queue processing
- **Database**: Cosmos DB, SQL Server, MySQL triggers and bindings  
- **Streaming**: Event Hubs for real-time data processing
- **Messaging**: Service Bus, Event Grid, RabbitMQ integration
- **Scheduling**: Timer triggers with CRON expressions
- **Durable Functions**: Orchestrators, activities, entities for workflows
- **Microservices**: Dapr integration, MCP tool integration
- **Real-time**: SignalR for live updates
- **Analytics**: Kusto (Azure Data Explorer) integration

Each template includes complete project files, configuration, dependencies, and follows Azure Functions best practices. Perfect for learning, prototyping, or production use.`,
    inputSchema: {
      language: z
        .enum(VALID_LANGUAGES)
        .describe(`Programming language for the Azure Functions template. Valid values: ${VALID_LANGUAGES.join(', ')}`),
      template: z.string().describe(`Template name. Valid templates vary by language:
      
C# (.NET Isolated Worker Model): 
${generateTemplateDescriptions('csharp')}

Java (Maven-based with Annotations): 
${generateTemplateDescriptions('java')}

Python (v2 Programming Model with Decorators): 
${generateTemplateDescriptions('python')}

TypeScript (Node.js v4 Programming Model): 
${generateTemplateDescriptions('typescript')}`),
      filePath: z
        .string()
        .optional()
        .describe(
          "Optional: specific file path within the template to retrieve (e.g., 'function_app.py', 'host.json', 'requirements.txt'). If omitted, returns all files in the template as a structured listing."
        ),
    },
  },
  async (args: { language: ValidLanguage; template: string; filePath?: string }) => {
    return handleGetTemplates(args, TEMPLATES_ROOT);
  }
);

// Tool to get supported languages
server.registerTool(
  'get_supported_languages',
  {
    title: 'Get Supported Languages',
    description: `Get overview of all supported programming languages for Azure Functions templates.

Returns detailed information about each supported language:
- **Runtime versions**: Supported language versions and runtimes
- **Programming models**: Language-specific patterns and frameworks  
- **Template counts**: Number of available templates per language
- **Key features**: Unique capabilities and strengths of each runtime
- **File patterns**: Typical project structure and key files

Perfect for choosing the right language for your Azure Functions project and understanding the development experience across different runtimes.`,
    inputSchema: {},
  },
  async () => {
    return handleGetSupportedLanguages();
  }
);

// Tool to get templates by language with descriptions
server.registerTool(
  'get_templates_by_language',
  {
    title: 'Get Templates by Language',
    description: `Browse all Azure Functions templates available for a specific programming language with detailed descriptions and use cases.

Returns organized categories of templates with:
- **Template descriptions**: What each template does and how it works
- **Use cases**: Real-world scenarios where each template is most useful  
- **Categories**: Grouped by functionality (Storage, Database, Messaging, etc.)
- **Selection guide**: Quick comparison to help choose the right template

Perfect for exploring available options and understanding Azure Functions capabilities in your preferred language before implementing a specific solution.`,
    inputSchema: {
      language: z
        .enum(VALID_LANGUAGES)
        .describe(`Programming language to get templates for. Valid values: ${VALID_LANGUAGES.join(', ')}`),
    },
  },
  async (args: { language: ValidLanguage }) => {
    return handleGetTemplatesByLanguage(args);
  }
);

// Tool to get template files for a specific language and template
server.registerTool(
  'get_template_files',
  {
    title: 'Get Template Files',
    description: `Get all files and complete source code for a specific Azure Functions template.

Returns complete template with:
- **Full source code**: All implementation files ready to use
- **Project structure**: Complete file organization and dependencies
- **Configuration files**: host.json, local.settings.json, build configs
- **Documentation**: README and metadata files where available

**Languages Available**: csharp, java, python, typescript

**Template Count by Language**:
- C#: ${VALID_TEMPLATES.csharp.length} templates (Isolated worker model)
- Java: ${VALID_TEMPLATES.java.length} templates (Maven with annotations) 
- Python: ${VALID_TEMPLATES.python.length} templates (v2 decorator model)
- TypeScript: ${VALID_TEMPLATES.typescript.length} templates (Node.js v4 model)

Use exact template names as returned by get_templates_by_language. Perfect for getting production-ready code that you can immediately deploy or customize for your specific needs.`,
    inputSchema: {
      language: z
        .enum(VALID_LANGUAGES)
        .describe(
          `REQUIRED: Programming language. Must be exactly one of: ${VALID_LANGUAGES.map((l) => `"${l}"`).join(', ')}`
        ),
      template: z
        .string()
        .describe(
          `REQUIRED: Exact template name. Must be one of the supported templates for the specified language. See description above for complete list of valid values for each language.`
        ),
    },
  },
  async (args: { language: ValidLanguage; template: string }) => {
    return handleGetTemplateFiles(args, TEMPLATES_ROOT);
  }
);

/**
 * Validate that all declared templates exist on disk
 * Logs warnings to stderr if any templates are missing
 */
async function validateTemplates(): Promise<void> {
  const result = await validateTemplatesExist(TEMPLATES_ROOT);

  if (!result.valid) {
    console.error(`[WARNING] Template validation found ${result.missing.length} missing template(s):`);
    for (const { language, template } of result.missing) {
      console.error(`  - ${language}/${template}`);
    }
    console.error(`Templates root: ${TEMPLATES_ROOT}`);
  }

  // Discover templates from filesystem and report discrepancies
  const discovered = await discoverTemplates(TEMPLATES_ROOT);

  if (discovered.extraOnDisk.length > 0) {
    console.error(`[INFO] Found ${discovered.extraOnDisk.length} undocumented template(s) on disk:`);
    for (const { language, template } of discovered.extraOnDisk) {
      console.error(`  + ${language}/${template} (consider adding to VALID_TEMPLATES)`);
    }
  }

  // Log discovery summary in verbose mode (can be enabled via environment variable)
  if (process.env.MCP_VERBOSE) {
    console.error(
      `[INFO] Template discovery: ${discovered.totalTemplates} templates found across ${discovered.languages.length} languages`
    );
  }
}

async function main() {
  // Validate templates exist before starting server
  await validateTemplates();

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
