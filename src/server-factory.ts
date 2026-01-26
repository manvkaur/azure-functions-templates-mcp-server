/**
 * Server factory - Creates and configures the MCP server.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { logger } from './logger.js';
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

/** Server configuration options */
export interface ServerConfig {
  name: string;
  version: string;
  templatesRoot: string;
}

/** Validation result from template checks */
export interface ValidationResult {
  valid: boolean;
  missingCount: number;
  extraCount: number;
  totalTemplates: number;
  messages: string[];
}

/**
 * Creates and configures an MCP server with all Azure Functions template tools.
 *
 * @param config Server configuration including name, version, and templates path
 * @returns Configured McpServer instance ready for connection
 */
export function createServer(config: ServerConfig): McpServer {
  logger.info('Creating MCP server', { name: config.name, version: config.version });

  const server = new McpServer({
    name: config.name,
    version: config.version,
  });

  registerTools(server, config.templatesRoot);

  logger.info('Server created successfully');
  return server;
}

/**
 * Registers all Azure Functions template tools on the server.
 *
 * @param server The MCP server instance
 * @param templatesRoot Path to the templates directory
 */
export function registerTools(server: McpServer, templatesRoot: string): void {
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
          .describe(
            `Programming language for the Azure Functions template. Valid values: ${VALID_LANGUAGES.join(', ')}`
          ),
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
      return handleGetTemplates(args, templatesRoot);
    }
  );

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
      return handleGetTemplateFiles(args, templatesRoot);
    }
  );
}

/**
 * Validates that all declared templates exist on disk.
 *
 * NOTE: Primary validation happens at build time via `npm run validate:templates`.
 * This runtime check provides additional safety and verbose logging.
 *
 * @param templatesRoot Path to the templates directory
 * @param verbose Whether to log verbose output
 * @returns Validation result with details
 */
export async function validateTemplates(templatesRoot: string, verbose = false): Promise<ValidationResult> {
  const messages: string[] = [];
  let valid = true;

  const result = await validateTemplatesExist(templatesRoot);

  if (!result.valid) {
    valid = false;
    messages.push(`[ERROR] Template validation failed - ${result.missing.length} missing template(s):`);
    for (const { language, template } of result.missing) {
      messages.push(`  - ${language}/${template}`);
    }
    messages.push(`Templates root: ${templatesRoot}`);
    messages.push(`[HINT] Run 'npm run validate:templates' for detailed diagnostics`);
  }

  // Discover templates from filesystem and report discrepancies
  const discovered = await discoverTemplates(templatesRoot);

  if (discovered.extraOnDisk.length > 0) {
    valid = false;
    messages.push(`[WARNING] Found ${discovered.extraOnDisk.length} undocumented template(s) on disk:`);
    for (const { language, template } of discovered.extraOnDisk) {
      messages.push(`  + ${language}/${template}`);
    }
    messages.push(`[HINT] Add to TEMPLATE_DESCRIPTIONS in src/templates.ts or run 'npm run validate:templates'`);
  }

  if (verbose) {
    messages.push(
      `[INFO] Template discovery: ${discovered.totalTemplates} templates found across ${discovered.languages.length} languages`
    );
  }

  return {
    valid,
    missingCount: result.missing.length,
    extraCount: discovered.extraOnDisk.length,
    totalTemplates: discovered.totalTemplates,
    messages,
  };
}

/**
 * Logs validation messages to stderr.
 *
 * @param result Validation result to log
 */
export function logValidationResult(result: ValidationResult): void {
  for (const message of result.messages) {
    console.error(message);
  }
}
