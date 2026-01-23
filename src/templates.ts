/**
 * Core template logic extracted for testability
 */
import { promises as fs } from "node:fs";
import path from "node:path";

// Valid languages and their templates (embedded as part of package)
export const VALID_LANGUAGES = ["csharp", "java", "python", "typescript"] as const;
export type ValidLanguage = typeof VALID_LANGUAGES[number];

export const VALID_TEMPLATES: Record<string, string[]> = {
  csharp: [
    "BlobInputOutputBindings", "BlobTrigger", "CosmosDBInputBinding", "CosmosDBOutputBinding", "CosmosDbTrigger",
    "DaprPublishOutputBinding", "DaprServiceInvocationTrigger", "DaprTopicTrigger", "DurableFunctionsEntityClass",
    "DurableFunctionsEntityFunction", "DurableFunctionsOrchestration", "EventGridBlobTrigger", "EventGridTrigger",
    "EventHubTrigger", "HttpTrigger", "KustoInputBinding", "KustoOutputBinding", "MCPToolTrigger",
    "MySqlInputBinding", "MySqlOutputBinding", "MySqlTrigger", "QueueTrigger", "RabbitMQTrigger",
    "ServiceBusQueueTrigger", "ServiceBusTopicTrigger", "SignalRConnectionInfoHttpTrigger", "SqlInputBinding",
    "SqlTrigger", "TimerTrigger"
  ],
  java: [
    "BlobInputBinding", "BlobOutputBinding", "BlobTrigger", "CosmosDBInputBinding", "CosmosDBOutputBinding",
    "DurableFunctions", "EventGridTrigger", "EventHubTrigger", "HttpTrigger", "MCPToolTrigger",
    "QueueTrigger", "ServiceBusQueueTrigger", "ServiceBusTopicTrigger", "TimerTrigger"
  ],
  python: [
    "BlobInputBinding", "BlobOutputBinding", "BlobTrigger", "BlobTriggerWithEventGrid", "CosmosDBInputOutputBinding",
    "CosmosDBTrigger", "EventHubTrigger", "HttpTrigger", "McpTrigger", "QueueTrigger", "TimerTrigger"
  ],
  typescript: [
    "BlobInputAndOutputBindings", "BlobTrigger", "BlobTriggerWithEventGrid", "CosmosDBInputOutBinding",
    "CosmosDBTrigger", "EventHubTrigger", "HttpTrigger", "McpTrigger", "QueueTrigger", "TimerTrigger"
  ]
};

// Shared template descriptions used across multiple tools
export const TEMPLATE_DESCRIPTIONS: Record<string, Record<string, { description: string; category: string; useCase: string }>> = {
  csharp: {
    "BlobInputOutputBindings": {
      description: "Combines blob input and output bindings in a single function",
      category: "Storage Bindings",
      useCase: "File transformation, data processing pipelines, content conversion"
    },
    "BlobTrigger": {
      description: "Triggered when files are added or modified in Azure Blob Storage",
      category: "Storage Triggers",
      useCase: "File processing, image resizing, document analysis, automated workflows"
    },
    "CosmosDBInputBinding": {
      description: "Reads documents from Azure Cosmos DB collections",
      category: "Database Bindings",
      useCase: "Data retrieval, document queries, read-only database operations"
    },
    "CosmosDBOutputBinding": {
      description: "Writes documents to Azure Cosmos DB collections",
      category: "Database Bindings",
      useCase: "Data persistence, document updates, write operations to NoSQL databases"
    },
    "CosmosDbTrigger": {
      description: "Triggered by changes in Cosmos DB using the change feed",
      category: "Database Triggers",
      useCase: "Real-time data processing, event sourcing, maintaining materialized views"
    },
    "DaprPublishOutputBinding": {
      description: "Publishes messages to Dapr pub/sub components",
      category: "Microservices",
      useCase: "Event-driven microservices, decoupled messaging, distributed architectures"
    },
    "DaprServiceInvocationTrigger": {
      description: "Handles Dapr service-to-service invocation requests",
      category: "Microservices",
      useCase: "Microservices communication, API gateways, service mesh integration"
    },
    "DaprTopicTrigger": {
      description: "Subscribes to Dapr pub/sub topics",
      category: "Microservices",
      useCase: "Event processing, asynchronous message handling, distributed workflows"
    },
    "DurableFunctionsEntityClass": {
      description: "Stateful entity class for managing persistent state",
      category: "Durable Functions",
      useCase: "State management, counters, workflow coordination, stateful processing"
    },
    "DurableFunctionsEntityFunction": {
      description: "Entity function for Durable Functions state management",
      category: "Durable Functions",
      useCase: "Singleton patterns, state machines, persistent counters, stateful logic"
    },
    "DurableFunctionsOrchestration": {
      description: "Orchestrator function for complex workflow coordination",
      category: "Durable Functions",
      useCase: "Multi-step workflows, business processes, saga patterns, long-running operations"
    },
    "EventGridBlobTrigger": {
      description: "Enhanced blob trigger using Azure Event Grid for better performance",
      category: "Storage Triggers",
      useCase: "High-performance file processing, event-driven blob operations, scalable workflows"
    },
    "EventGridTrigger": {
      description: "Handles Azure Event Grid events from various sources",
      category: "Event Processing",
      useCase: "Event-driven architectures, system integration, reactive applications"
    },
    "EventHubTrigger": {
      description: "Processes streaming data from Azure Event Hubs",
      category: "Streaming",
      useCase: "Real-time analytics, IoT data processing, telemetry ingestion, big data streams"
    },
    "HttpTrigger": {
      description: "HTTP-triggered function for REST API endpoints",
      category: "Web APIs",
      useCase: "REST APIs, webhooks, web services, serverless backends"
    },
    "KustoInputBinding": {
      description: "Queries data from Azure Data Explorer (Kusto)",
      category: "Analytics",
      useCase: "Data analytics, time-series queries, telemetry analysis, reporting"
    },
    "KustoOutputBinding": {
      description: "Ingests data into Azure Data Explorer (Kusto)",
      category: "Analytics",
      useCase: "Analytics data ingestion, telemetry storage, time-series data collection"
    },
    "MCPToolTrigger": {
      description: "Model Context Protocol integration for AI assistant tools",
      category: "AI/ML",
      useCase: "AI assistant integrations, LLM tool calling, intelligent automation"
    },
    "MySqlInputBinding": {
      description: "Reads data from MySQL databases",
      category: "Database Bindings",
      useCase: "Database queries, data synchronization, reporting, ETL processes"
    },
    "MySqlOutputBinding": {
      description: "Writes data to MySQL databases",
      category: "Database Bindings",
      useCase: "Data persistence, database updates, transaction processing"
    },
    "MySqlTrigger": {
      description: "Triggered by changes in MySQL databases",
      category: "Database Triggers",
      useCase: "Change data capture, real-time sync, audit logging"
    },
    "QueueTrigger": {
      description: "Processes messages from Azure Storage Queues",
      category: "Storage Triggers",
      useCase: "Asynchronous processing, background jobs, work queues, task scheduling"
    },
    "RabbitMQTrigger": {
      description: "Consumes messages from RabbitMQ queues",
      category: "Messaging",
      useCase: "Message processing, distributed systems, enterprise messaging"
    },
    "ServiceBusQueueTrigger": {
      description: "Handles messages from Azure Service Bus queues",
      category: "Messaging",
      useCase: "Reliable messaging, enterprise integration, transactional processing"
    },
    "ServiceBusTopicTrigger": {
      description: "Subscribes to Azure Service Bus topics",
      category: "Messaging",
      useCase: "Publish-subscribe patterns, event broadcasting, multi-consumer scenarios"
    },
    "SignalRConnectionInfoHttpTrigger": {
      description: "Provides SignalR connection information via HTTP",
      category: "Real-time Communication",
      useCase: "Real-time web applications, chat systems, live notifications"
    },
    "SqlInputBinding": {
      description: "Reads data from SQL Server/Azure SQL databases",
      category: "Database Bindings",
      useCase: "SQL queries, reporting, data retrieval, database integration"
    },
    "SqlTrigger": {
      description: "Triggered by changes in SQL Server/Azure SQL databases",
      category: "Database Triggers",
      useCase: "Change data capture, real-time sync, audit trails"
    },
    "TimerTrigger": {
      description: "Scheduled function execution using CRON expressions",
      category: "Scheduling",
      useCase: "Batch processing, scheduled maintenance, periodic cleanup, automated tasks"
    }
  },
  java: {
    "BlobInputBinding": {
      description: "Reads blob data as input binding",
      category: "Storage Bindings",
      useCase: "File processing, data ingestion, content reading, document analysis"
    },
    "BlobOutputBinding": {
      description: "Writes data to Azure Blob Storage as output binding",
      category: "Storage Bindings",
      useCase: "File generation, data export, report creation, content publishing"
    },
    "BlobTrigger": {
      description: "Triggered by blob storage events",
      category: "Storage Triggers",
      useCase: "Automated file processing, image processing, ETL pipelines"
    },
    "CosmosDBInputBinding": {
      description: "Reads documents from Cosmos DB collections",
      category: "Database Bindings",
      useCase: "Document queries, data retrieval, NoSQL database operations"
    },
    "CosmosDBOutputBinding": {
      description: "Writes documents to Cosmos DB collections",
      category: "Database Bindings",
      useCase: "Data persistence, document storage, NoSQL write operations"
    },
    "DurableFunctions": {
      description: "Durable Functions orchestration and activities",
      category: "Durable Functions",
      useCase: "Complex workflows, business processes, stateful operations, saga patterns"
    },
    "EventGridTrigger": {
      description: "Handles Azure Event Grid events from various sources",
      category: "Event Processing",
      useCase: "Event-driven architectures, reactive systems, system integration"
    },
    "EventHubTrigger": {
      description: "Processes streaming data from Azure Event Hubs",
      category: "Streaming",
      useCase: "Real-time analytics, IoT data processing, stream processing, big data ingestion"
    },
    "HttpTrigger": {
      description: "HTTP API endpoints for web requests",
      category: "Web APIs",
      useCase: "REST APIs, web services, serverless backends, webhook handling"
    },
    "MCPToolTrigger": {
      description: "Model Context Protocol tool integration",
      category: "AI/ML",
      useCase: "AI assistant tools, LLM integrations, intelligent automation"
    },
    "QueueTrigger": {
      description: "Processes messages from Azure Storage Queues",
      category: "Storage Triggers",
      useCase: "Asynchronous processing, background jobs, task scheduling"
    },
    "ServiceBusQueueTrigger": {
      description: "Handles messages from Azure Service Bus queues",
      category: "Messaging",
      useCase: "Enterprise messaging, reliable processing, transactional messaging"
    },
    "ServiceBusTopicTrigger": {
      description: "Subscribes to Azure Service Bus topics",
      category: "Messaging",
      useCase: "Publish-subscribe patterns, event broadcasting, distributed messaging"
    },
    "TimerTrigger": {
      description: "Scheduled execution using CRON expressions",
      category: "Scheduling",
      useCase: "Batch processing, scheduled tasks, periodic operations, maintenance jobs"
    }
  },
  python: {
    "BlobInputBinding": {
      description: "Reads blob data as input binding",
      category: "Storage Bindings",
      useCase: "File processing, data analysis, content reading, ML data preprocessing"
    },
    "BlobOutputBinding": {
      description: "Writes data to Azure Blob Storage as output binding",
      category: "Storage Bindings",
      useCase: "File generation, data export, ML model outputs, report creation"
    },
    "BlobTrigger": {
      description: "Triggered by blob storage events",
      category: "Storage Triggers",
      useCase: "Automated file processing, image analysis, data pipelines, ETL workflows"
    },
    "BlobTriggerWithEventGrid": {
      description: "Enhanced blob trigger using Event Grid for improved performance",
      category: "Storage Triggers",
      useCase: "High-performance file processing, scalable blob operations, event-driven workflows"
    },
    "CosmosDBInputOutputBinding": {
      description: "Combined Cosmos DB input and output bindings",
      category: "Database Bindings",
      useCase: "Document transformation, data migration, NoSQL data processing"
    },
    "CosmosDBTrigger": {
      description: "Triggered by Cosmos DB changes using change feed",
      category: "Database Triggers",
      useCase: "Real-time data processing, event sourcing, data synchronization, change tracking"
    },
    "EventHubTrigger": {
      description: "Processes streaming data from Azure Event Hubs",
      category: "Streaming",
      useCase: "Real-time analytics, IoT data processing, telemetry analysis, data science workflows"
    },
    "HttpTrigger": {
      description: "HTTP API endpoints for web requests",
      category: "Web APIs",
      useCase: "REST APIs, webhooks, web services, ML model serving, data science APIs"
    },
    "McpTrigger": {
      description: "Model Context Protocol integration for AI workflows",
      category: "AI/ML",
      useCase: "AI assistant tools, LLM integrations, ML pipeline automation, intelligent workflows"
    },
    "QueueTrigger": {
      description: "Processes messages from Azure Storage Queues",
      category: "Storage Triggers",
      useCase: "Background processing, async data processing, task queues, batch processing"
    },
    "TimerTrigger": {
      description: "Scheduled execution using CRON expressions in Python",
      category: "Scheduling",
      useCase: "Data science jobs, ML model training, automated reports, periodic data processing"
    }
  },
  typescript: {
    "BlobInputAndOutputBindings": {
      description: "Combined blob input and output bindings in a single function",
      category: "Storage Bindings",
      useCase: "File transformation, data processing pipelines, content conversion"
    },
    "BlobTrigger": {
      description: "Triggered when files are added or modified in Azure Blob Storage",
      category: "Storage Triggers",
      useCase: "File processing, image manipulation, document workflows, automated processing"
    },
    "BlobTriggerWithEventGrid": {
      description: "Enhanced blob trigger using Azure Event Grid for better performance",
      category: "Storage Triggers",
      useCase: "High-performance file processing, scalable blob operations, event-driven workflows"
    },
    "CosmosDBInputOutBinding": {
      description: "Combined Cosmos DB input and output bindings",
      category: "Database Bindings",
      useCase: "Document transformation, data migration, NoSQL data processing"
    },
    "CosmosDBTrigger": {
      description: "Triggered by changes in Cosmos DB using the change feed",
      category: "Database Triggers",
      useCase: "Real-time data processing, change notifications, event-driven updates"
    },
    "EventHubTrigger": {
      description: "Processes streaming data from Azure Event Hubs",
      category: "Streaming",
      useCase: "Real-time analytics, IoT telemetry processing, streaming data pipelines"
    },
    "HttpTrigger": {
      description: "HTTP API endpoints for web requests",
      category: "Web APIs",
      useCase: "REST APIs, web services, serverless backends, webhook handlers"
    },
    "McpTrigger": {
      description: "Model Context Protocol integration for AI workflows",
      category: "AI/ML",
      useCase: "AI assistant tools, LLM integrations, intelligent automation workflows"
    },
    "QueueTrigger": {
      description: "Processes messages from Azure Storage Queues",
      category: "Storage Triggers",
      useCase: "Asynchronous processing, background jobs, task queues, decoupled architectures"
    },
    "TimerTrigger": {
      description: "Scheduled execution using CRON expressions",
      category: "Scheduling",
      useCase: "Scheduled tasks, batch processing, maintenance jobs, periodic operations"
    }
  }
};

// File extension to language mapping for syntax highlighting
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
  '.yaml': 'yaml'
};

// Common files that apply to all templates per language
export const LANGUAGE_COMMON_FILES: Record<string, Record<string, string>> = {
  csharp: {
    ".funcignore": `# Azure Functions deployment exclusions for C#
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
`
  },
  java: {
    ".funcignore": `# Azure Functions deployment exclusions for Java
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
`
  },
  python: {
    ".funcignore": `# Azure Functions deployment exclusions for Python
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
`
  },
  typescript: {
    ".funcignore": `# Azure Functions deployment exclusions for TypeScript
# Exclude source files and development artifacts from deployment

# Dependencies (reinstalled during deployment)
node_modules/

# TypeScript source (only deploy compiled JS)
src/
*.ts
!*.d.ts
tsconfig.json

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
`
  }
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
export function generateTemplateDescriptions(language: string): string {
  const templates = VALID_TEMPLATES[language];
  const descriptions = TEMPLATE_DESCRIPTIONS[language];

  if (!templates) {
    return '';
  }

  return templates.map(template => {
    const desc = descriptions?.[template];
    const description = desc?.description ?? "No description available";
    return `- ${template}: ${description}`;
  }).join('\n');
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
export function getTemplatesForLanguage(language: string): string[] | null {
  if (!isValidLanguage(language)) {
    return null;
  }
  return VALID_TEMPLATES[language];
}

/**
 * Get template description
 */
export function getTemplateDescription(language: string, template: string): { description: string; category: string; useCase: string } | null {
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
    case "python":
      keyFiles = ["function_app.py", "host.json", "local.settings.json", "requirements.txt"];
      break;
    case "csharp":
      keyFiles = [".template.config/template.json", ".template.config/vs-2017.3.host.json", "host.json", "local.settings.json"];
      // Also include .cs files
      const csFiles = allFiles.filter(f => f.endsWith(".cs"));
      keyFiles.push(...csFiles.slice(0, 2)); // Include up to 2 .cs files
      break;
    case "java":
      keyFiles = ["pom.xml", "host.json", "local.settings.json"];
      // Include Java source files from src/main/java subdirectory
      const javaSourceFiles = allFiles.filter(f => f.includes("src/main/java") && f.endsWith(".java"));
      keyFiles.push(...javaSourceFiles.slice(0, 2)); // Include up to 2 Java source files
      break;
    case "typescript":
      keyFiles = ["function.json", "index.ts", "metadata.json", "package.json", "host.json", "readme.md"];
      break;
    default:
      keyFiles = ["README.md", "package.json", "host.json"];
  }

  return keyFiles;
}

/**
 * Group templates by category for a language
 */
export function groupTemplatesByCategory(language: string): { categories: Record<string, string[]>; uncategorized: string[] } {
  const templates = VALID_TEMPLATES[language] ?? [];
  const descriptions = TEMPLATE_DESCRIPTIONS[language] ?? {};

  const categories: Record<string, string[]> = {};
  const uncategorized: string[] = [];

  templates.forEach(template => {
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
 * Get language details for documentation
 */
export function getLanguageDetails() {
  return {
    csharp: {
      name: "C#",
      runtime: ".NET 8, 9, 10 (Isolated Worker), .NET Framework 4.8.1",
      programmingModel: "Isolated worker process with dependency injection",
      templateCount: VALID_TEMPLATES.csharp.length,
      keyFeatures: [
        "Strong typing with C# language features",
        "Isolated worker process for better performance and reliability",
        "Built-in dependency injection support",
        "Support for .NET 8, 9, 10 and .NET Framework 4.8.1",
        "Rich ecosystem of NuGet packages"
      ],
      filePatterns: [".cs files", ".template.config/template.json", "host.json", "local.settings.json"]
    },
    java: {
      name: "Java",
      runtime: "Java 8, 11, 17, 21 (GA), Java 25 (Preview)",
      programmingModel: "Annotation-based with Maven build system",
      templateCount: VALID_TEMPLATES.java.length,
      keyFeatures: [
        "Annotation-based function definitions",
        "Maven project structure and dependency management",
        "Support for Java 8, 11, 17, 21, and 25 (Preview)",
        "Enterprise-ready with extensive libraries",
        "Cross-platform compatibility"
      ],
      filePatterns: ["pom.xml", "src/main/java/**/*.java", "host.json", "local.settings.json"]
    },
    python: {
      name: "Python",
      runtime: "Python 3.10, 3.11, 3.12, 3.13",
      programmingModel: "v2 programming model with decorators",
      templateCount: VALID_TEMPLATES.python.length,
      keyFeatures: [
        "Modern v2 programming model with @app decorators",
        "Single function_app.py file for multiple functions",
        "Rich ecosystem of Python packages",
        "Built-in support for data science and ML libraries",
        "Simplified development and testing experience"
      ],
      filePatterns: ["function_app.py", "requirements.txt", "host.json", "local.settings.json"]
    },
    typescript: {
      name: "TypeScript",
      runtime: "Node.js 20, 22 (GA), Node.js 24 (Preview)",
      programmingModel: "Node.js v4 programming model with TypeScript support",
      templateCount: VALID_TEMPLATES.typescript.length,
      keyFeatures: [
        "Strong typing with TypeScript language features",
        "Modern async/await patterns",
        "Rich npm ecosystem integration",
        "Built-in JSON and HTTP handling",
        "Excellent tooling and IDE support"
      ],
      filePatterns: ["index.ts", "function.json", "package.json", "metadata.json"]
    }
  };
}
