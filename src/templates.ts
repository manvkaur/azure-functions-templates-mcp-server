/**
 * Template definitions and utilities.
 * TEMPLATE_DESCRIPTIONS is the single source of truth; VALID_TEMPLATES is derived from it.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

export const VALID_LANGUAGES = ['csharp', 'java', 'python', 'typescript'] as const;
export type ValidLanguage = (typeof VALID_LANGUAGES)[number];

// ============================================================================
// RUNTIME VERSIONS - UPDATE THESE WHEN NEW VERSIONS ARE RELEASED
// Check for updates: https://learn.microsoft.com/azure/azure-functions/functions-versions
// ============================================================================

/**
 * Supported runtime versions for each language.
 * Update these values when new runtime versions are released or deprecated.
 *
 * @see https://learn.microsoft.com/azure/azure-functions/functions-versions
 * @see https://learn.microsoft.com/azure/azure-functions/supported-languages
 */
export const SUPPORTED_RUNTIMES = {
  /** Last updated: January 2026 */
  lastUpdated: '2026-01',

  python: {
    supported: ['3.10', '3.11', '3.12', '3.13'],
    preview: [] as string[],
    deprecated: ['3.8', '3.9'],
    recommended: '3.11',
  },
  typescript: {
    // TypeScript runs on Node.js runtime
    supported: ['20', '22'],
    preview: ['24'],
    deprecated: ['18'],
    recommended: '20',
  },
  java: {
    supported: ['8', '11', '17', '21'],
    preview: ['25'],
    deprecated: [] as string[],
    recommended: '21',
    mavenMinVersion: '3.5',
    /** Maven compiler plugin version - check Maven Central for updates */
    mavenCompilerPluginVersion: '3.8.1',
    /** Azure Functions Maven plugin version - check Maven Central for updates */
    mavenPluginVersion: '1.37.0',
    /** Azure Functions Java library version - check Maven Central for updates */
    javaLibraryVersion: '3.2.2',
  },
  csharp: {
    // .NET versions for isolated worker model
    supported: ['8', '9', '10'],
    preview: [] as string[],
    deprecated: ['6', '7'],
    recommended: '8',
    // .NET Framework is also supported for Windows
    frameworkSupported: ['4.8.1'],
  },

  /** Azure Functions runtime version */
  functionsRuntime: '4.x',

  /** Extension bundle version range */
  extensionBundle: '[4.*, 5.0.0)',
} as const;

/**
 * Formats runtime versions into a human-readable string.
 */
export function formatRuntimeVersions(language: ValidLanguage): string {
  const runtime = SUPPORTED_RUNTIMES[language];

  let result = '';

  if (language === 'python') {
    result = `Python ${runtime.supported.join(', ')}`;
  } else if (language === 'typescript') {
    result = `Node.js ${runtime.supported.join(', ')} (GA)`;
    if (runtime.preview.length > 0) {
      result += `, Node.js ${runtime.preview.join(', ')} (Preview)`;
    }
  } else if (language === 'java') {
    result = `Java ${runtime.supported.join(', ')} (GA)`;
    if (runtime.preview.length > 0) {
      result += `, Java ${runtime.preview.join(', ')} (Preview)`;
    }
  } else if (language === 'csharp') {
    result = `.NET ${runtime.supported.join(', ')} (Isolated Worker)`;
    if ('frameworkSupported' in runtime && runtime.frameworkSupported) {
      result += `, .NET Framework ${runtime.frameworkSupported.join(', ')}`;
    }
  }

  return result;
}

// ============================================================================

/**
 * Language information for developers.
 * Includes runtime versions, prerequisites, and development guidance.
 */
export interface LanguageInfo {
  name: string;
  runtime: string;
  programmingModel: string;
  prerequisites: string[];
  /** General development tools and IDE recommendations (client-agnostic) */
  developmentTools: string[];
  initCommand: string;
  runCommand: string;
  buildCommand?: string;
}

/**
 * Template parameter definition for customizable values.
 */
export interface TemplateParameter {
  name: string;
  description: string;
  defaultValue: string;
  validValues?: string[];
  source?: 'SUPPORTED_RUNTIMES' | 'user_input';
}

/**
 * Project template files for initializing a new Azure Functions project.
 * Templates may contain {{paramName}} placeholders that should be replaced.
 */
export interface ProjectTemplate {
  files: Record<string, string>;
  initInstructions: string;
  projectStructure: string[];
  /** Parameters that can/should be customized. Use {{paramName}} syntax in files. */
  parameters?: TemplateParameter[];
}

/**
 * App setting configuration with description and metadata.
 */
export interface AppSettingConfig {
  description: string;
  required: boolean;
  defaultLocalValue?: string;
}

/**
 * Function-specific binding configuration.
 */
export interface BindingConfig {
  /** App settings required for this binding */
  appSettings: Record<string, AppSettingConfig>;
  /** Whether this binding uses the extension bundle */
  extensionBundle: boolean;
  /** Additional packages to install (language-specific) */
  additionalPackages?: string[];
}

/**
 * Extended template metadata with binding configuration.
 */
export interface ExtendedTemplateMetadata {
  description: string;
  category: string;
  useCase: string;
  binding?: BindingConfig;
  isProjectLevel?: boolean; // Files that belong at project level vs function level
}

/**
 * Language information with prerequisites and development guidance.
 *
 * Runtime versions are derived from SUPPORTED_RUNTIMES for easy updates.
 * @see https://learn.microsoft.com/azure/azure-functions/functions-versions
 */
export const LANGUAGE_INFO: Record<ValidLanguage, LanguageInfo> = {
  python: {
    name: 'Python',
    runtime: formatRuntimeVersions('python'),
    programmingModel: 'v2 programming model with @app decorators',
    prerequisites: [
      `Python ${SUPPORTED_RUNTIMES.python.recommended} or later installed`,
      `Azure Functions Core Tools v${SUPPORTED_RUNTIMES.functionsRuntime}`,
      'Azure CLI (optional, for deployment)',
    ],
    developmentTools: ['Azure Functions Core Tools CLI'],
    initCommand: 'func init --python',
    runCommand: 'func start',
  },
  typescript: {
    name: 'TypeScript',
    runtime: formatRuntimeVersions('typescript'),
    programmingModel: 'Node.js v4 programming model with TypeScript',
    prerequisites: [
      `Node.js ${SUPPORTED_RUNTIMES.typescript.recommended}.x or later installed`,
      `Azure Functions Core Tools v${SUPPORTED_RUNTIMES.functionsRuntime}`,
      'npm package manager',
      'Azure CLI (optional, for deployment)',
    ],
    developmentTools: ['Azure Functions Core Tools CLI'],
    initCommand: 'func init --typescript',
    runCommand: 'npm start',
    buildCommand: 'npm run build',
  },
  java: {
    name: 'Java',
    runtime: formatRuntimeVersions('java'),
    programmingModel: 'Annotation-based with Maven build system',
    prerequisites: [
      `JDK ${SUPPORTED_RUNTIMES.java.recommended} installed (${SUPPORTED_RUNTIMES.java.supported.join(', ')} supported)`,
      `Apache Maven ${SUPPORTED_RUNTIMES.java.mavenMinVersion}+`,
      `Azure Functions Core Tools v${SUPPORTED_RUNTIMES.functionsRuntime}`,
      'Azure CLI (optional, for deployment)',
    ],
    developmentTools: ['Azure Functions Core Tools CLI'],
    initCommand:
      'mvn archetype:generate -DarchetypeGroupId=com.microsoft.azure -DarchetypeArtifactId=azure-functions-archetype',
    runCommand: 'mvn azure-functions:run',
    buildCommand: 'mvn clean package',
  },
  csharp: {
    name: 'C#',
    runtime: formatRuntimeVersions('csharp'),
    programmingModel: 'Isolated worker process with dependency injection',
    prerequisites: [
      `.NET ${SUPPORTED_RUNTIMES.csharp.recommended} SDK or later installed`,
      `Azure Functions Core Tools v${SUPPORTED_RUNTIMES.functionsRuntime}`,
      'Azure CLI (optional, for deployment)',
    ],
    developmentTools: ['Azure Functions Core Tools CLI'],
    initCommand: 'func init --dotnet-isolated',
    runCommand: 'func start',
    buildCommand: 'dotnet build',
  },
};

/**
 * Project-level template files for each language.
 * These files initialize a new Azure Functions project.
 */
export const PROJECT_TEMPLATES: Record<ValidLanguage, ProjectTemplate> = {
  python: {
    files: {
      'host.json': JSON.stringify(
        {
          version: '2.0',
          logging: {
            applicationInsights: {
              samplingSettings: {
                isEnabled: true,
                excludedTypes: 'Request',
              },
            },
          },
          extensionBundle: {
            id: 'Microsoft.Azure.Functions.ExtensionBundle',
            version: SUPPORTED_RUNTIMES.extensionBundle,
          },
        },
        null,
        2
      ),
      'local.settings.json': JSON.stringify(
        {
          IsEncrypted: false,
          Values: {
            FUNCTIONS_WORKER_RUNTIME: 'python',
            AzureWebJobsStorage: 'UseDevelopmentStorage=true',
          },
        },
        null,
        2
      ),
      'requirements.txt': `# Azure Functions dependencies
azure-functions

# Uncomment to enable Azure Monitor OpenTelemetry
# Ref: aka.ms/functions-azure-monitor-python
# azure-monitor-opentelemetry
`,
      '.funcignore': `# Azure Functions deployment exclusions for Python
.venv/
venv/
.env/
__pycache__/
*.py[cod]
.vscode/
local.settings.json
.git/
tests/
test_*.py
`,
    },
    initInstructions: `## Python Azure Functions Project Setup

1. Create a virtual environment:
   \`\`\`bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Create your first function in \`function_app.py\`

4. Run locally:
   \`\`\`bash
   func start
   \`\`\`
`,
    projectStructure: [
      'function_app.py    # Main application file with all functions',
      'host.json          # Azure Functions host configuration',
      'local.settings.json # Local development settings (do not commit)',
      'requirements.txt   # Python dependencies',
      '.funcignore        # Files to exclude from deployment',
    ],
  },
  typescript: {
    files: {
      'host.json': JSON.stringify(
        {
          version: '2.0',
          logging: {
            applicationInsights: {
              samplingSettings: {
                isEnabled: true,
                excludedTypes: 'Request',
              },
            },
          },
          extensionBundle: {
            id: 'Microsoft.Azure.Functions.ExtensionBundle',
            version: SUPPORTED_RUNTIMES.extensionBundle,
          },
        },
        null,
        2
      ),
      'local.settings.json': JSON.stringify(
        {
          IsEncrypted: false,
          Values: {
            FUNCTIONS_WORKER_RUNTIME: 'node',
            AzureWebJobsStorage: 'UseDevelopmentStorage=true',
          },
        },
        null,
        2
      ),
      'package.json': JSON.stringify(
        {
          name: 'azure-functions-app',
          version: '1.0.0',
          description: 'Azure Functions TypeScript project',
          main: 'dist/src/functions/*.js',
          scripts: {
            build: 'tsc',
            watch: 'tsc -w',
            clean: 'rimraf dist',
            prestart: 'npm run clean && npm run build',
            start: 'func start',
            test: 'echo "No tests yet..."',
          },
          dependencies: {
            '@azure/functions': '^4.0.0',
          },
          devDependencies: {
            'azure-functions-core-tools': '^4.x',
            '@types/node': '{{nodeVersion}}.x',
            typescript: '^5.0.0',
            rimraf: '^5.0.0',
          },
        },
        null,
        2
      ),
      '.funcignore': `# Azure Functions deployment exclusions for TypeScript
node_modules/
src/
*.ts
!*.d.ts
.vscode/
local.settings.json
.git/
*.test.ts
*.spec.ts
`,
    },
    initInstructions: `## TypeScript Azure Functions Project Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create your functions in \`src/functions/\` directory

3. Build and run locally:
   \`\`\`bash
   npm start
   \`\`\`

4. For development with auto-rebuild:
   \`\`\`bash
   npm run watch
   # In another terminal: func start
   \`\`\`
`,
    projectStructure: [
      'src/functions/     # Function implementation files',
      'host.json          # Azure Functions host configuration',
      'local.settings.json # Local development settings (do not commit)',
      'package.json       # Node.js dependencies and scripts',
      '.funcignore        # Files to exclude from deployment',
    ],
    parameters: [
      {
        name: 'nodeVersion',
        description: 'Node.js version for @types/node. Detect from user environment or ask preference.',
        defaultValue: SUPPORTED_RUNTIMES.typescript.recommended,
        validValues: [...SUPPORTED_RUNTIMES.typescript.supported, ...SUPPORTED_RUNTIMES.typescript.preview],
        source: 'SUPPORTED_RUNTIMES',
      },
    ],
  },
  java: {
    files: {
      'host.json': JSON.stringify(
        {
          version: '2.0',
          logging: {
            applicationInsights: {
              samplingSettings: {
                isEnabled: true,
                excludedTypes: 'Request',
              },
            },
          },
          extensionBundle: {
            id: 'Microsoft.Azure.Functions.ExtensionBundle',
            version: SUPPORTED_RUNTIMES.extensionBundle,
          },
        },
        null,
        2
      ),
      'local.settings.json': JSON.stringify(
        {
          IsEncrypted: false,
          Values: {
            FUNCTIONS_WORKER_RUNTIME: 'java',
            AzureWebJobsStorage: 'UseDevelopmentStorage=true',
          },
        },
        null,
        2
      ),
      '.funcignore': `# Azure Functions deployment exclusions for Java
target/
.idea/
.vscode/
*.iml
local.settings.json
.git/
src/test/
`,
    },
    initInstructions: `## Java Azure Functions Project Setup

**Note**: pom.xml content is available in \`get_azure_functions_template\`. Copy/Merge the pom.xml from the function template you choose.

1. Build the project:
   \`\`\`bash
   mvn clean package
   \`\`\`

2. Create your functions in \`src/main/java/com/function/\` directory

3. Run locally:
   \`\`\`bash
   mvn azure-functions:run
   \`\`\`
`,
    projectStructure: [
      'src/main/java/     # Java source files',
      'pom.xml            # Maven project configuration (from template)',
      'host.json          # Azure Functions host configuration',
      'local.settings.json # Local development settings (do not commit)',
      '.funcignore        # Files to exclude from deployment',
    ],
    parameters: [
      {
        name: 'javaVersion',
        description: 'Java version for compilation and runtime. Detect from user environment or ask preference.',
        defaultValue: SUPPORTED_RUNTIMES.java.recommended,
        validValues: [...SUPPORTED_RUNTIMES.java.supported, ...SUPPORTED_RUNTIMES.java.preview],
        source: 'SUPPORTED_RUNTIMES',
      },
    ],
  },
  csharp: {
    files: {
      'local.settings.json': JSON.stringify(
        {
          IsEncrypted: false,
          Values: {
            FUNCTIONS_WORKER_RUNTIME: 'dotnet-isolated',
            AzureWebJobsStorage: 'UseDevelopmentStorage=true',
          },
        },
        null,
        2
      ),
      '.funcignore': `# Azure Functions deployment exclusions for C#
bin/
obj/
.vs/
.vscode/
*.user
*.suo
local.settings.json
.git/
**/[Tt]ests/
*.Tests.csproj
`,
    },
    initInstructions: `## C# Azure Functions Project Setup

1. Create project using .NET CLI:
   \`\`\`bash
   func init --dotnet-isolated
   \`\`\`

2. Or use Visual Studio / VS Code with Azure Functions extension

3. Build and run:
   \`\`\`bash
   dotnet build
   func start
   \`\`\`

**Note**: C# projects are typically initialized using \`func init\` or Visual Studio
templates which create the .csproj file with proper dependencies.
Use \`func new\` to add functions after project initialization.
`,
    projectStructure: [
      '*.csproj            # C# project file',
      'Program.cs          # Application entry point',
      'host.json           # Azure Functions host configuration',
      'local.settings.json # Local development settings (do not commit)',
      '.funcignore         # Files to exclude from deployment',
    ],
  },
};

/**
 * Common configuration required for ALL Azure Functions apps.
 * These settings are needed regardless of which triggers/bindings are used.
 */
export const COMMON_APP_SETTINGS: Record<string, AppSettingConfig> = {
  /** Used by Functions host for internal operations (timers, durable state, etc.) */
  AzureWebJobsStorage: {
    description: 'Storage account connection for Azure Functions host internal use',
    required: true,
    defaultLocalValue: 'UseDevelopmentStorage=true',
  },
  // Add more common settings here as needed, e.g.:
  // APPLICATIONINSIGHTS_CONNECTION_STRING: {
  //   description: 'Application Insights connection for monitoring',
  //   required: false,
  // },
};

/**
 * Binding configurations for templates that require additional settings.
 *
 * Note: AzureWebJobsStorage (defined in COMMON_APP_SETTINGS) is for host internal use.
 * Customer storage bindings should use separate connection settings.
 */
export const BINDING_CONFIGS: Record<string, BindingConfig> = {
  CosmosDBTrigger: {
    appSettings: {
      CosmosDbConnection: {
        description: 'Connection string for Azure Cosmos DB account',
        required: true,
      },
    },
    extensionBundle: true,
  },
  CosmosDBInputBinding: {
    appSettings: {
      CosmosDbConnection: {
        description: 'Connection string for Azure Cosmos DB account',
        required: true,
      },
    },
    extensionBundle: true,
  },
  CosmosDBOutputBinding: {
    appSettings: {
      CosmosDbConnection: {
        description: 'Connection string for Azure Cosmos DB account',
        required: true,
      },
    },
    extensionBundle: true,
  },
  BlobTrigger: {
    appSettings: {
      BlobStorageConnection: {
        description: 'Connection string for Azure Blob Storage account',
        defaultLocalValue: 'UseDevelopmentStorage=true',
        required: true,
      },
    },
    extensionBundle: true,
  },
  BlobInputBinding: {
    appSettings: {
      BlobStorageConnection: {
        description: 'Connection string for Azure Blob Storage account',
        defaultLocalValue: 'UseDevelopmentStorage=true',
        required: true,
      },
    },
    extensionBundle: true,
  },
  BlobOutputBinding: {
    appSettings: {
      BlobStorageConnection: {
        description: 'Connection string for Azure Blob Storage account',
        defaultLocalValue: 'UseDevelopmentStorage=true',
        required: true,
      },
    },
    extensionBundle: true,
  },
  QueueTrigger: {
    appSettings: {
      QueueStorageConnection: {
        description: 'Connection string for Azure Queue Storage account',
        defaultLocalValue: 'UseDevelopmentStorage=true',
        required: true,
      },
    },
    extensionBundle: true,
  },
  EventHubTrigger: {
    appSettings: {
      EventHubConnection: {
        description: 'Connection string for Azure Event Hub namespace',
        required: true,
      },
    },
    extensionBundle: true,
  },
  ServiceBusQueueTrigger: {
    appSettings: {
      ServiceBusConnection: {
        description: 'Connection string for Azure Service Bus namespace',
        required: true,
      },
    },
    extensionBundle: true,
  },
  ServiceBusTopicTrigger: {
    appSettings: {
      ServiceBusConnection: {
        description: 'Connection string for Azure Service Bus namespace',
        required: true,
      },
    },
    extensionBundle: true,
  },
  EventGridTrigger: {
    appSettings: {},
    extensionBundle: true,
  },
  TimerTrigger: {
    appSettings: {},
    extensionBundle: false,
  },
  HttpTrigger: {
    appSettings: {},
    extensionBundle: false,
  },
};

/**
 * Zod schema for template metadata validation.
 * Ensures all templates have required fields with meaningful content.
 */
export const TemplateMetadataSchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must not exceed 200 characters'),
  category: z
    .string()
    .min(3, 'Category must be at least 3 characters')
    .max(50, 'Category must not exceed 50 characters'),
  useCase: z
    .string()
    .min(10, 'Use case must be at least 10 characters')
    .max(200, 'Use case must not exceed 200 characters'),
  bindingType: z
    .enum(['trigger', 'input', 'output'])
    .optional()
    .describe(
      'The type of Azure Functions binding: trigger (required, one per function), input (optional), output (optional)'
    ),
  resource: z
    .string()
    .optional()
    .describe('The Azure resource this binding interacts with (e.g., blob, cosmos, queue, servicebus)'),
});

/** Template metadata structure (inferred from Zod schema) */
export type TemplateMetadata = z.infer<typeof TemplateMetadataSchema>;

/** Schema for a language's template collection */
export const LanguageTemplatesSchema = z.record(z.string(), TemplateMetadataSchema);

/** Schema for all template descriptions */
export const AllTemplateDescriptionsSchema = z.object({
  csharp: LanguageTemplatesSchema,
  java: LanguageTemplatesSchema,
  python: LanguageTemplatesSchema,
  typescript: LanguageTemplatesSchema,
});

/**
 * Validates TEMPLATE_DESCRIPTIONS against the schema.
 * Returns validation result with errors if any.
 */
export function validateTemplateDescriptions(): {
  valid: boolean;
  errors: string[];
} {
  const result = AllTemplateDescriptionsSchema.safeParse(TEMPLATE_DESCRIPTIONS);
  if (result.success) {
    return { valid: true, errors: [] };
  }
  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return { valid: false, errors };
}

// ============================================================================
// COMMON TEMPLATE METADATA - Single source of truth for descriptions/use cases
// These are shared across languages since trigger/binding behavior is identical
// ============================================================================

/**
 * Common template metadata shared across all languages.
 * Use cases and descriptions don't change between language runtimes - only code changes.
 * Keys use kebab-case identifiers that map to language-specific template names.
 */
export const COMMON_TEMPLATE_METADATA = {
  // ─────────────────────────────────────────────────────────────────────────
  // TRIGGERS (What starts the function)
  // ─────────────────────────────────────────────────────────────────────────
  'http-trigger': {
    description: 'HTTP-triggered function for REST API endpoints and webhooks',
    category: 'Web APIs',
    useCase: 'REST APIs, webhooks, web services, serverless backends',
    bindingType: 'trigger' as const,
    resource: 'http',
  },
  'timer-trigger': {
    description: 'Scheduled function execution using CRON expressions',
    category: 'Scheduling',
    useCase: 'Scheduled jobs, cleanup tasks, batch processing, periodic maintenance',
    bindingType: 'trigger' as const,
    resource: 'timer',
  },
  'blob-trigger': {
    description: 'Triggered when files are added or modified in Azure Blob Storage',
    category: 'Storage Triggers',
    useCase: 'File processing, image resizing, document analysis, ETL workflows',
    bindingType: 'trigger' as const,
    resource: 'blob',
  },
  'blob-trigger-eventgrid': {
    description: 'Enhanced blob trigger using Event Grid for better performance and reliability',
    category: 'Storage Triggers',
    useCase: 'High-performance file processing, scalable blob operations, event-driven workflows',
    bindingType: 'trigger' as const,
    resource: 'blob',
  },
  'queue-trigger': {
    description: 'Processes messages from Azure Storage Queues',
    category: 'Storage Triggers',
    useCase: 'Background job processing, async tasks, work queues, decoupled architectures',
    bindingType: 'trigger' as const,
    resource: 'queue',
  },
  'servicebus-queue-trigger': {
    description: 'Handles messages from Azure Service Bus queues',
    category: 'Messaging',
    useCase: 'Enterprise messaging, reliable processing, transactional messaging, decoupling',
    bindingType: 'trigger' as const,
    resource: 'servicebus',
  },
  'servicebus-topic-trigger': {
    description: 'Subscribes to Azure Service Bus topics',
    category: 'Messaging',
    useCase: 'Publish-subscribe patterns, event broadcasting, multi-consumer scenarios',
    bindingType: 'trigger' as const,
    resource: 'servicebus',
  },
  'eventhub-trigger': {
    description: 'Processes streaming data from Azure Event Hubs',
    category: 'Streaming',
    useCase: 'IoT telemetry, log ingestion, real-time analytics, big data streams',
    bindingType: 'trigger' as const,
    resource: 'eventhub',
  },
  'eventgrid-trigger': {
    description: 'Handles Azure Event Grid events from various sources',
    category: 'Event Processing',
    useCase: 'React to Azure resource events, event-driven architectures, system integration',
    bindingType: 'trigger' as const,
    resource: 'eventgrid',
  },
  'cosmosdb-trigger': {
    description: 'Triggered by changes in Cosmos DB using the change feed',
    category: 'Database Triggers',
    useCase: 'Real-time data sync, event sourcing, maintaining materialized views',
    bindingType: 'trigger' as const,
    resource: 'cosmos',
  },
  'sql-trigger': {
    description: 'Triggered by row changes in SQL Server/Azure SQL databases',
    category: 'Database Triggers',
    useCase: 'Database change tracking, real-time sync, audit logging',
    bindingType: 'trigger' as const,
    resource: 'sql',
  },
  'mysql-trigger': {
    description: 'Triggered by changes in MySQL databases',
    category: 'Database Triggers',
    useCase: 'Change data capture, real-time sync, audit logging',
    bindingType: 'trigger' as const,
    resource: 'mysql',
  },
  'kafka-trigger': {
    description: 'Consumes messages from Kafka topics',
    category: 'Streaming',
    useCase: 'Streaming data pipelines, event processing, real-time analytics',
    bindingType: 'trigger' as const,
    resource: 'kafka',
  },
  'durable-orchestration': {
    description: 'Orchestrator function for complex workflow coordination',
    category: 'Durable Functions',
    useCase: 'Long-running workflows, saga patterns, business processes, stateful operations',
    bindingType: 'trigger' as const,
    resource: 'durable',
  },
  'durable-entity': {
    description: 'Stateful entity for managing persistent state',
    category: 'Durable Functions',
    useCase: 'State management, counters, workflow coordination, singleton patterns',
    bindingType: 'trigger' as const,
    resource: 'durable',
  },
  'mcp-tool-trigger': {
    description: 'Model Context Protocol trigger for exposing functions as discoverable tools',
    category: 'AI Integration',
    useCase: 'Remote MCP servers for AI agents, tool discovery, LLM function calling',
    bindingType: 'trigger' as const,
    resource: 'mcp',
  },
  'mcp-resource-trigger': {
    description: 'Model Context Protocol resource trigger for exposing resources to MCP clients',
    category: 'AI Integration',
    useCase: 'Resource discovery, documentation exposure, knowledge base integration',
    bindingType: 'trigger' as const,
    resource: 'mcp',
  },
  'rabbitmq-trigger': {
    description: 'Consumes messages from RabbitMQ queues',
    category: 'Messaging',
    useCase: 'Message processing, distributed systems, enterprise messaging',
    bindingType: 'trigger' as const,
    resource: 'rabbitmq',
  },
  'generic-trigger': {
    description: 'Generic trigger for custom extension trigger types',
    category: 'Advanced',
    useCase: 'Custom triggers, new extension triggers, experimental features',
    bindingType: 'trigger' as const,
    resource: 'generic',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INPUT BINDINGS (Read data)
  // ─────────────────────────────────────────────────────────────────────────
  'blob-input': {
    description: 'Reads files from Azure Blob Storage',
    category: 'Storage Bindings',
    useCase: 'File processing, data ingestion, content reading, document analysis',
    bindingType: 'input' as const,
    resource: 'blob',
  },
  'blob-input-output': {
    description: 'Combines blob input and output bindings in a single function',
    category: 'Storage Bindings',
    useCase: 'File transformation, data processing pipelines, content conversion',
    bindingType: 'input' as const,
    resource: 'blob',
  },
  'cosmosdb-input': {
    description: 'Reads documents from Azure Cosmos DB collections',
    category: 'Database Bindings',
    useCase: 'Data retrieval, document queries, read-only database operations',
    bindingType: 'input' as const,
    resource: 'cosmos',
  },
  'cosmosdb-input-output': {
    description: 'Combined Cosmos DB input and output bindings',
    category: 'Database Bindings',
    useCase: 'Document transformation, data migration, NoSQL data processing',
    bindingType: 'input' as const,
    resource: 'cosmos',
  },
  'sql-input': {
    description: 'Reads data from SQL Server/Azure SQL databases',
    category: 'Database Bindings',
    useCase: 'Query database rows, reporting, data retrieval',
    bindingType: 'input' as const,
    resource: 'sql',
  },
  'mysql-input': {
    description: 'Reads data from MySQL databases',
    category: 'Database Bindings',
    useCase: 'Database queries, data synchronization, reporting, ETL processes',
    bindingType: 'input' as const,
    resource: 'mysql',
  },
  'table-input': {
    description: 'Reads entities from Azure Table Storage',
    category: 'Storage Bindings',
    useCase: 'Read table entities, configuration lookup, simple data retrieval',
    bindingType: 'input' as const,
    resource: 'table',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OUTPUT BINDINGS (Write data)
  // ─────────────────────────────────────────────────────────────────────────
  'blob-output': {
    description: 'Writes files to Azure Blob Storage',
    category: 'Storage Bindings',
    useCase: 'File generation, data export, report creation, content publishing',
    bindingType: 'output' as const,
    resource: 'blob',
  },
  'queue-output': {
    description: 'Sends messages to Azure Storage Queues',
    category: 'Storage Bindings',
    useCase: 'Send queue messages, async task dispatch, work distribution',
    bindingType: 'output' as const,
    resource: 'queue',
  },
  'servicebus-output': {
    description: 'Sends messages to Azure Service Bus queue/topic',
    category: 'Messaging',
    useCase: 'Send messages to queue/topic, enterprise messaging, reliable delivery',
    bindingType: 'output' as const,
    resource: 'servicebus',
  },
  'eventhub-output': {
    description: 'Emits events to Azure Event Hubs',
    category: 'Streaming',
    useCase: 'Emit streaming events, telemetry output, event publishing',
    bindingType: 'output' as const,
    resource: 'eventhub',
  },
  'cosmosdb-output': {
    description: 'Writes documents to Azure Cosmos DB collections',
    category: 'Database Bindings',
    useCase: 'Data persistence, document updates, write operations to NoSQL databases',
    bindingType: 'output' as const,
    resource: 'cosmos',
  },
  'sql-output': {
    description: 'Inserts/updates rows in SQL Server/Azure SQL databases',
    category: 'Database Bindings',
    useCase: 'Insert/update rows, data persistence, database writes',
    bindingType: 'output' as const,
    resource: 'sql',
  },
  'mysql-output': {
    description: 'Writes data to MySQL databases',
    category: 'Database Bindings',
    useCase: 'Data persistence, database updates, transaction processing',
    bindingType: 'output' as const,
    resource: 'mysql',
  },
  'table-output': {
    description: 'Writes entities to Azure Table Storage',
    category: 'Storage Bindings',
    useCase: 'Write table entities, configuration storage, simple data persistence',
    bindingType: 'output' as const,
    resource: 'table',
  },
  'signalr-output': {
    description: 'Pushes real-time updates via Azure SignalR Service',
    category: 'Real-time Communication',
    useCase: 'Push real-time updates, live notifications, chat systems',
    bindingType: 'output' as const,
    resource: 'signalr',
  },
  'signalr-connection': {
    description: 'Provides SignalR connection information via HTTP',
    category: 'Real-time Communication',
    useCase: 'Real-time web applications, chat systems, live notifications',
    bindingType: 'trigger' as const,
    resource: 'signalr',
  },
  'sendgrid-output': {
    description: 'Sends emails via SendGrid',
    category: 'Notifications',
    useCase: 'Send emails, notifications, automated messaging',
    bindingType: 'output' as const,
    resource: 'sendgrid',
  },
  'twilio-output': {
    description: 'Sends SMS via Twilio',
    category: 'Notifications',
    useCase: 'Send SMS, mobile notifications, alerts',
    bindingType: 'output' as const,
    resource: 'twilio',
  },
} as const;

/** Helper to get common metadata by key */
const common = (key: keyof typeof COMMON_TEMPLATE_METADATA): TemplateMetadata =>
  COMMON_TEMPLATE_METADATA[key] as TemplateMetadata;

/**
 * TEMPLATE_DESCRIPTIONS is the single source of truth for all template metadata.
 * Template names are derived from the keys of this object.
 * Uses COMMON_TEMPLATE_METADATA for consistent descriptions across languages.
 */
export const TEMPLATE_DESCRIPTIONS: Record<ValidLanguage, Record<string, TemplateMetadata>> = {
  csharp: {
    BlobInputBinding: common('blob-input'),
    BlobOutputBinding: common('blob-output'),
    BlobTrigger: common('blob-trigger'),
    CosmosDBInputBinding: common('cosmosdb-input'),
    CosmosDBOutputBinding: common('cosmosdb-output'),
    CosmosDBTrigger: common('cosmosdb-trigger'),
    DurableFunctionsEntityClass: common('durable-entity'),
    DurableFunctionsEntityFunction: common('durable-entity'),
    DurableFunctionsOrchestration: common('durable-orchestration'),
    EventGridBlobTrigger: common('blob-trigger-eventgrid'),
    EventGridTrigger: common('eventgrid-trigger'),
    EventHubTrigger: common('eventhub-trigger'),
    HttpTrigger: common('http-trigger'),
    MCPResourceTrigger: common('mcp-resource-trigger'),
    MCPToolTrigger: common('mcp-tool-trigger'),
    MySqlInputBinding: common('mysql-input'),
    MySqlOutputBinding: common('mysql-output'),
    MySqlTrigger: common('mysql-trigger'),
    QueueTrigger: common('queue-trigger'),
    RabbitMQTrigger: common('rabbitmq-trigger'),
    ServiceBusQueueTrigger: common('servicebus-queue-trigger'),
    ServiceBusTopicTrigger: common('servicebus-topic-trigger'),
    SignalRConnectionInfoHttpTrigger: common('signalr-connection'),
    SqlInputBinding: common('sql-input'),
    SqlTrigger: common('sql-trigger'),
    TimerTrigger: common('timer-trigger'),
  },
  java: {
    BlobInputBinding: common('blob-input'),
    BlobOutputBinding: common('blob-output'),
    BlobTrigger: common('blob-trigger'),
    CosmosDBInputBinding: common('cosmosdb-input'),
    CosmosDBOutputBinding: common('cosmosdb-output'),
    CosmosDBTrigger: common('cosmosdb-trigger'),
    DurableFunctions: common('durable-orchestration'),
    EventGridTrigger: common('eventgrid-trigger'),
    EventHubTrigger: common('eventhub-trigger'),
    HttpTrigger: common('http-trigger'),
    MCPToolTrigger: common('mcp-tool-trigger'),
    QueueTrigger: common('queue-trigger'),
    ServiceBusQueueTrigger: common('servicebus-queue-trigger'),
    ServiceBusTopicTrigger: common('servicebus-topic-trigger'),
    TimerTrigger: common('timer-trigger'),
  },
  python: {
    BlobInputBinding: common('blob-input'),
    BlobOutputBinding: common('blob-output'),
    BlobTrigger: common('blob-trigger'),
    BlobTriggerWithEventGrid: common('blob-trigger-eventgrid'),
    CosmosDBInputBinding: common('cosmosdb-input'),
    CosmosDBOutputBinding: common('cosmosdb-output'),
    CosmosDBTrigger: common('cosmosdb-trigger'),
    EventHubTrigger: common('eventhub-trigger'),
    GenericTrigger: common('generic-trigger'),
    HttpTrigger: common('http-trigger'),
    MCPResourceTrigger: common('mcp-resource-trigger'),
    MCPToolTrigger: common('mcp-tool-trigger'),
    QueueTrigger: common('queue-trigger'),
    ServiceBusQueueTrigger: common('servicebus-queue-trigger'),
    ServiceBusTopicTrigger: common('servicebus-topic-trigger'),
    TimerTrigger: common('timer-trigger'),
  },
  typescript: {
    BlobInputBinding: common('blob-input'),
    BlobOutputBinding: common('blob-output'),
    BlobTrigger: common('blob-trigger'),
    BlobTriggerWithEventGrid: common('blob-trigger-eventgrid'),
    CosmosDBInputBinding: common('cosmosdb-input'),
    CosmosDBOutputBinding: common('cosmosdb-output'),
    CosmosDBTrigger: common('cosmosdb-trigger'),
    EventHubTrigger: common('eventhub-trigger'),
    GenericTrigger: common('generic-trigger'),
    HttpTrigger: common('http-trigger'),
    MCPResourceTrigger: common('mcp-resource-trigger'),
    MCPToolTrigger: common('mcp-tool-trigger'),
    QueueTrigger: common('queue-trigger'),
    TimerTrigger: common('timer-trigger'),
  },
};

function deriveValidTemplates(): Record<ValidLanguage, string[]> {
  const result = {} as Record<ValidLanguage, string[]>;
  for (const lang of VALID_LANGUAGES) {
    result[lang] = Object.keys(TEMPLATE_DESCRIPTIONS[lang]).sort();
  }
  return result;
}

export const VALID_TEMPLATES: Record<ValidLanguage, string[]> = deriveValidTemplates();

export const FILE_EXTENSION_MAP: Record<string, string> = {
  '.cs': 'csharp',
  '.java': 'java',
  '.py': 'python',
  '.ts': 'typescript',
  '.js': 'javascript',
  '.json': 'json',
  '.xml': 'xml',
  '.md': 'markdown',
  '.txt': 'text',
  '.yml': 'yaml',
  '.yaml': 'yaml',
};

export const LANGUAGE_COMMON_FILES: Record<string, Record<string, string>> = {
  csharp: {
    '.funcignore': `# Azure Functions deployment exclusions for C#
# Exclude build artifacts and development files from deployment

# Build outputs
bin/
obj/

# IDE and tooling
.vs/
.vscode/
*.user
*.suo

# Local settings (contains secrets)
local.settings.json

# Source control
.git/
.gitignore

# Test files
**/[Tt]ests/
*.Tests.csproj
`,
  },
  java: {
    '.funcignore': `# Azure Functions deployment exclusions for Java
# Exclude build artifacts and development files from deployment

# Maven build output
target/

# IDE files
.idea/
.vscode/
*.iml

# Local settings (contains secrets)
local.settings.json

# Source control
.git/
.gitignore

# Test files
src/test/
`,
  },
  python: {
    '.funcignore': `# Azure Functions deployment exclusions for Python
# Exclude development files and local artifacts from deployment

# Virtual environments
.venv/
venv/
env/
.env/

# Python cache
__pycache__/
*.py[cod]
*$py.class
.python_packages/

# IDE files
.vscode/
.idea/

# Local settings (contains secrets)
local.settings.json

# Source control
.git/
.gitignore

# Test files
tests/
test_*.py
*_test.py
`,
  },
  typescript: {
    '.funcignore': `# Azure Functions deployment exclusions for TypeScript
# Exclude source files and development artifacts from deployment

# Dependencies (reinstalled during deployment)
node_modules/

# TypeScript source (only deploy compiled JS)
src/
*.ts
!*.d.ts

# IDE files
.vscode/

# Local settings (contains secrets)
local.settings.json

# Source control
.git/
.gitignore

# Test files
tests/
*.test.ts
*.spec.ts
`,
  },
};

/**
 * Check if a path exists
 */
export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that all templates in VALID_TEMPLATES exist on disk
 * @param templatesRoot The root directory containing template folders
 * @returns Object with validation results
 */
export async function validateTemplatesExist(templatesRoot: string): Promise<{
  valid: boolean;
  missing: Array<{ language: string; template: string }>;
  checked: number;
}> {
  const missing: Array<{ language: string; template: string }> = [];
  let checked = 0;

  for (const language of VALID_LANGUAGES) {
    const templates = VALID_TEMPLATES[language];
    for (const template of templates) {
      checked++;
      const templatePath = path.join(templatesRoot, language, template);
      if (!(await exists(templatePath))) {
        missing.push({ language, template });
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    checked,
  };
}

/**
 * Result of template discovery from filesystem
 */
export interface DiscoveredTemplates {
  /** Templates discovered on disk, organized by language */
  templates: Record<string, string[]>;
  /** Languages found in the templates directory */
  languages: string[];
  /** Total number of templates discovered */
  totalTemplates: number;
  /** Templates in VALID_TEMPLATES but not found on disk */
  missingFromDisk: Array<{ language: string; template: string }>;
  /** Templates found on disk but not in VALID_TEMPLATES (new/undocumented) */
  extraOnDisk: Array<{ language: string; template: string }>;
}

/**
 * Discover templates from the filesystem by scanning the templates directory.
 * Compares discovered templates against VALID_TEMPLATES to find discrepancies.
 *
 * @param templatesRoot The root directory containing template folders
 * @returns Object with discovered templates and comparison results
 */
export async function discoverTemplates(templatesRoot: string): Promise<DiscoveredTemplates> {
  const templates: Record<string, string[]> = {};
  const languages: string[] = [];
  let totalTemplates = 0;
  const missingFromDisk: Array<{ language: string; template: string }> = [];
  const extraOnDisk: Array<{ language: string; template: string }> = [];

  // Check if templates root exists
  if (!(await exists(templatesRoot))) {
    return {
      templates,
      languages,
      totalTemplates,
      missingFromDisk: VALID_LANGUAGES.flatMap((lang) =>
        VALID_TEMPLATES[lang].map((t) => ({ language: lang, template: t }))
      ),
      extraOnDisk,
    };
  }

  // Scan for language directories
  try {
    const entries = await fs.readdir(templatesRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const langName = entry.name;
        const langPath = path.join(templatesRoot, langName);

        // Scan for template directories within this language
        const templateEntries = await fs.readdir(langPath, { withFileTypes: true });
        const discoveredTemplates: string[] = [];

        for (const templateEntry of templateEntries) {
          if (templateEntry.isDirectory()) {
            discoveredTemplates.push(templateEntry.name);
            totalTemplates++;
          }
        }

        if (discoveredTemplates.length > 0) {
          templates[langName] = discoveredTemplates.sort();
          languages.push(langName);
        }
      }
    }
  } catch {
    // Error reading directory
  }

  // Compare with VALID_TEMPLATES to find discrepancies
  for (const lang of VALID_LANGUAGES) {
    const expected = new Set(VALID_TEMPLATES[lang]);
    const discovered = new Set(templates[lang] ?? []);

    // Find templates in VALID_TEMPLATES but not on disk
    for (const template of expected) {
      if (!discovered.has(template)) {
        missingFromDisk.push({ language: lang, template });
      }
    }

    // Find templates on disk but not in VALID_TEMPLATES
    for (const template of discovered) {
      if (!expected.has(template)) {
        extraOnDisk.push({ language: lang, template });
      }
    }
  }

  // Also check for unexpected language directories
  for (const lang of languages) {
    if (!VALID_LANGUAGES.includes(lang as ValidLanguage)) {
      const langTemplates = templates[lang] ?? [];
      for (const template of langTemplates) {
        extraOnDisk.push({ language: lang, template });
      }
    }
  }

  return {
    templates,
    languages: languages.sort(),
    totalTemplates,
    missingFromDisk,
    extraOnDisk,
  };
}

/**
 * Recursively list all files in a directory
 */
export async function listFilesRecursive(dir: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const inner = await listFilesRecursive(full);
        results.push(...inner);
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  return results;
}

/**
 * Get file extension for syntax highlighting
 */
export function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return FILE_EXTENSION_MAP[ext] || 'text';
}

/**
 * Generate template descriptions for tool schema
 */
export function generateTemplateDescriptions(language: ValidLanguage): string {
  const templates = VALID_TEMPLATES[language];
  const descriptions = TEMPLATE_DESCRIPTIONS[language];

  return templates
    .map((template) => {
      const desc = descriptions[template];
      const description = desc?.description ?? 'No description available';
      return `- ${template}: ${description}`;
    })
    .join('\n');
}

/**
 * Validate if a language is supported
 */
export function isValidLanguage(language: string): language is ValidLanguage {
  return VALID_LANGUAGES.includes(language as ValidLanguage);
}

/**
 * Validate if a template is valid for a given language
 */
export function isValidTemplate(language: string, template: string): boolean {
  if (!isValidLanguage(language)) {
    return false;
  }
  return VALID_TEMPLATES[language].includes(template);
}

/**
 * Get templates for a language
 */
export function getTemplatesForLanguage(language: string): readonly string[] | null {
  if (!isValidLanguage(language)) {
    return null;
  }
  return VALID_TEMPLATES[language];
}

/**
 * Get template description
 */
export function getTemplateDescription(
  language: string,
  template: string
): { description: string; category: string; useCase: string } | null {
  if (!isValidLanguage(language)) {
    return null;
  }
  return TEMPLATE_DESCRIPTIONS[language]?.[template] ?? null;
}

/**
 * Check for path traversal attacks
 */
export function isPathTraversal(basePath: string, requestedPath: string): boolean {
  const resolvedBase = path.resolve(basePath);
  const resolvedFull = path.resolve(basePath, requestedPath);

  // Check if the resolved path starts with the base path
  return !resolvedFull.startsWith(resolvedBase + path.sep) && resolvedFull !== resolvedBase;
}

/**
 * Get key files to display for a language
 */
export function getKeyFilesForLanguage(language: string, allFiles: string[]): string[] {
  let keyFiles: string[] = [];

  switch (language) {
    case 'python':
      keyFiles = ['function_app.py', 'host.json', 'local.settings.json', 'requirements.txt'];
      break;
    case 'csharp': {
      keyFiles = [
        '.template.config/template.json',
        '.template.config/vs-2017.3.host.json',
        'host.json',
        'local.settings.json',
      ];
      // Also include .cs files
      const csFiles = allFiles.filter((f) => f.endsWith('.cs'));
      keyFiles.push(...csFiles.slice(0, 2)); // Include up to 2 .cs files
      break;
    }
    case 'java': {
      keyFiles = ['pom.xml', 'host.json', 'local.settings.json'];
      // Include Java source files from src/main/java subdirectory
      const javaSourceFiles = allFiles.filter((f) => f.includes('src/main/java') && f.endsWith('.java'));
      keyFiles.push(...javaSourceFiles.slice(0, 2)); // Include up to 2 Java source files
      break;
    }
    case 'typescript':
      keyFiles = ['function.json', 'index.ts', 'metadata.json', 'package.json', 'host.json', 'readme.md'];
      break;
    default:
      keyFiles = ['README.md', 'package.json', 'host.json'];
  }

  return keyFiles;
}

/**
 * Group templates by category for a language
 */
export function groupTemplatesByCategory(language: ValidLanguage): {
  categories: Record<string, string[]>;
  uncategorized: string[];
} {
  const templates = VALID_TEMPLATES[language];
  const descriptions = TEMPLATE_DESCRIPTIONS[language];

  const categories: Record<string, string[]> = {};
  const uncategorized: string[] = [];

  templates.forEach((template) => {
    const desc = descriptions[template];
    if (desc) {
      if (!categories[desc.category]) {
        categories[desc.category] = [];
      }
      categories[desc.category].push(template);
    } else {
      uncategorized.push(template);
    }
  });

  return { categories, uncategorized };
}

/**
 * Group templates by binding type (triggers, input bindings, output bindings).
 * Useful for showing composable parts: pick 1 trigger + 0 or more bindings.
 */
export function groupTemplatesByBindingType(language: ValidLanguage): {
  triggers: string[];
  inputBindings: string[];
  outputBindings: string[];
} {
  const templates = VALID_TEMPLATES[language];
  const descriptions = TEMPLATE_DESCRIPTIONS[language];

  const triggers: string[] = [];
  const inputBindings: string[] = [];
  const outputBindings: string[] = [];

  templates.forEach((template) => {
    const desc = descriptions[template];
    switch (desc?.bindingType) {
      case 'trigger':
        triggers.push(template);
        break;
      case 'input':
        inputBindings.push(template);
        break;
      case 'output':
        outputBindings.push(template);
        break;
    }
  });

  return { triggers, inputBindings, outputBindings };
}

/**
 * Get language details for documentation.
 * Uses SUPPORTED_RUNTIMES for version information.
 * @see https://learn.microsoft.com/azure/azure-functions/functions-versions
 */
export function getLanguageDetails() {
  const formatSupportedVersions = (lang: ValidLanguage): string => {
    const runtime = SUPPORTED_RUNTIMES[lang];
    const supported = runtime.supported.join(', ');
    const preview = runtime.preview.length > 0 ? `, ${runtime.preview.join(', ')} (Preview)` : '';
    return `${supported} (GA)${preview}`;
  };

  return {
    csharp: {
      name: 'C#',
      runtime: formatRuntimeVersions('csharp'),
      programmingModel: 'Isolated worker process with dependency injection',
      templateCount: VALID_TEMPLATES.csharp.length,
      keyFeatures: [
        'Strong typing with C# language features',
        'Isolated worker process for better performance and reliability',
        'Built-in dependency injection support',
        `Support for .NET ${SUPPORTED_RUNTIMES.csharp.supported.join(', ')}${'frameworkSupported' in SUPPORTED_RUNTIMES.csharp ? ` and .NET Framework ${SUPPORTED_RUNTIMES.csharp.frameworkSupported.join(', ')}` : ''}`,
        'Rich ecosystem of NuGet packages',
      ],
      filePatterns: ['.cs files', '.template.config/template.json', 'host.json', 'local.settings.json'],
    },
    java: {
      name: 'Java',
      runtime: formatRuntimeVersions('java'),
      programmingModel: 'Annotation-based with Maven build system',
      templateCount: VALID_TEMPLATES.java.length,
      keyFeatures: [
        'Annotation-based function definitions',
        'Maven project structure and dependency management',
        `Support for Java ${formatSupportedVersions('java')}`,
        'Enterprise-ready with extensive libraries',
        'Cross-platform compatibility',
      ],
      filePatterns: ['pom.xml', 'src/main/java/**/*.java', 'host.json', 'local.settings.json'],
    },
    python: {
      name: 'Python',
      runtime: formatRuntimeVersions('python'),
      programmingModel: 'v2 programming model with decorators',
      templateCount: VALID_TEMPLATES.python.length,
      keyFeatures: [
        'Modern v2 programming model with @app decorators',
        'Single function_app.py file for multiple functions',
        'Rich ecosystem of Python packages',
        'Built-in support for data science and ML libraries',
        'Simplified development and testing experience',
      ],
      filePatterns: ['function_app.py', 'requirements.txt', 'host.json', 'local.settings.json'],
    },
    typescript: {
      name: 'TypeScript',
      runtime: formatRuntimeVersions('typescript'),
      programmingModel: 'Node.js v4 programming model with TypeScript support',
      templateCount: VALID_TEMPLATES.typescript.length,
      keyFeatures: [
        'Strong typing with TypeScript language features',
        'Modern async/await patterns',
        'Rich npm ecosystem integration',
        'Built-in JSON and HTTP handling',
        'Excellent tooling and IDE support',
      ],
      filePatterns: ['index.ts', 'function.json', 'package.json', 'metadata.json'],
    },
  };
}
