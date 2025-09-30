import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Templates are packaged with this server
// When running from dist/, templates folder is at package root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(__dirname, "..", "..", "templates");

const server = new McpServer({
  name: "azure-functions-templates",
  version: "1.0.0",
});

// Valid languages and their templates (embedded as part of package)
const VALID_LANGUAGES = ["csharp", "java", "python", "typescript"] as const;

const VALID_TEMPLATES: Record<string, string[]> = {
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
const TEMPLATE_DESCRIPTIONS: Record<string, Record<string, { description: string; category: string; useCase: string }>> = {
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
const FILE_EXTENSION_MAP: Record<string, string> = {
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

// Helper function to generate template descriptions for tool schema
function generateTemplateDescriptions(language: string): string {
  const templates = VALID_TEMPLATES[language];
  const descriptions = TEMPLATE_DESCRIPTIONS[language];
  
  return templates.map(template => {
    const desc = descriptions[template];
    const description = desc?.description ?? "No description available";
    return `- ${template}: ${description}`;
  }).join('\n');
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listFilesRecursive(dir: string): Promise<string[]> {
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

// Single comprehensive tool for Azure Functions templates
server.registerTool(
  "get_azure_functions_templates",
  {
    title: "Get Azure Functions Template",
    description: `Get complete Azure Functions templates with all files for rapid development and deployment.

Ready-to-use templates across 4 languages with complete project structure:

 **C# (.NET Isolated)**: 29 templates including Durable Functions, Dapr integration, database bindings
 **Java (Maven)**: 14 templates with annotation-based configuration and Maven project structure  
 **Python (v2 Model)**: 11 templates using modern decorator-based programming model
 **TypeScript (Node.js)**: 10 templates with full type safety and modern async patterns

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
      language: z.enum(VALID_LANGUAGES).describe(`Programming language for the Azure Functions template. Valid values: ${VALID_LANGUAGES.join(", ")}`),
      template: z.string().describe(`Template name. Valid templates vary by language:
      
C# (.NET Isolated Worker Model): 
${generateTemplateDescriptions('csharp')}

Java (Maven-based with Annotations): 
${generateTemplateDescriptions('java')}

Python (v2 Programming Model with Decorators): 
${generateTemplateDescriptions('python')}

TypeScript (Node.js v4 Programming Model): 
${generateTemplateDescriptions('typescript')}`),
      filePath: z.string().optional().describe("Optional: specific file path within the template to retrieve (e.g., 'function_app.py', 'host.json', 'requirements.txt'). If omitted, returns all files in the template as a structured listing.")
    },
  },
  async (args: { language: string; template: string; filePath?: string }) => {
    const { language, template, filePath } = args;
    
    // Validate language
    if (!VALID_LANGUAGES.includes(language as any)) {
      return { 
        content: [{ 
          type: "text", 
          text: `Invalid language: ${language}. Valid languages are: ${VALID_LANGUAGES.join(", ")}` 
        }], 
        isError: true 
      };
    }
    
    // Validate template for the given language
    const validTemplatesForLang = VALID_TEMPLATES[language];
    if (!validTemplatesForLang.includes(template)) {
      return { 
        content: [{ 
          type: "text", 
          text: `Invalid template '${template}' for language '${language}'. Valid templates for ${language} are: ${validTemplatesForLang.join(", ")}` 
        }], 
        isError: true 
      };
    }

    const templateDir = path.join(TEMPLATES_ROOT, language, template);
    if (!(await exists(templateDir))) {
      return { 
        content: [{ 
          type: "text", 
          text: `Template directory not found: ${language}/${template}` 
        }], 
        isError: true 
      };
    }

    // If specific file requested, return that file
    if (filePath) {
      const fullPath = path.resolve(templateDir, filePath);
      
      // Security: prevent path traversal
      if (!fullPath.startsWith(path.resolve(templateDir) + path.sep) && path.resolve(templateDir) !== fullPath) {
        return { 
          content: [{ 
            type: "text", 
            text: "Invalid filePath: path traversal detected" 
          }], 
          isError: true 
        };
      }
      
      if (!(await exists(fullPath))) {
        return { 
          content: [{ 
            type: "text", 
            text: `File not found: ${filePath}` 
          }], 
          isError: true 
        };
      }
      
      const stat = await fs.lstat(fullPath);
      if (!stat.isFile()) {
        return { 
          content: [{ 
            type: "text", 
            text: `Path is not a file: ${filePath}` 
          }], 
          isError: true 
        };
      }
      
      const content = await fs.readFile(fullPath, "utf8");
      return { 
        content: [{ 
          type: "text", 
          text: `=== ${filePath} ===\n${content}` 
        }] 
      };
    }

    // Return all files in the template
    const allFiles = await listFilesRecursive(templateDir);
    const relativeFiles = allFiles.map(f => path.relative(templateDir, f));
    
    let result = `=== Azure Functions Template: ${language}/${template} ===\n\n`;
    result += `Files in this template:\n${relativeFiles.join("\n")}\n\n`;
    
    // Include content of key files based on language patterns and subfolder structures
    let keyFiles: string[] = [];
    
    switch (language) {
      case "python":
        keyFiles = ["function_app.py", "host.json", "local.settings.json", "requirements.txt"];
        break;
      case "csharp":
        keyFiles = [".template.config/template.json", ".template.config/vs-2017.3.host.json", "host.json", "local.settings.json"];
        // Also include .cs files
        const csFiles = relativeFiles.filter(f => f.endsWith(".cs"));
        keyFiles.push(...csFiles.slice(0, 2)); // Include up to 2 .cs files
        break;
      case "java":
        keyFiles = ["pom.xml", "host.json", "local.settings.json"];
        // Include Java source files from src/main/java subdirectory
        const javaSourceFiles = relativeFiles.filter(f => f.includes("src/main/java") && f.endsWith(".java"));
        keyFiles.push(...javaSourceFiles.slice(0, 2)); // Include up to 2 Java source files
        break;
      case "typescript":
        keyFiles = ["function.json", "index.ts", "metadata.json", "package.json", "host.json", "readme.md"];
        break;
      default:
        keyFiles = ["README.md", "package.json", "host.json"];
    }
    
    for (const keyFile of keyFiles) {
      const keyPath = path.join(templateDir, keyFile);
      if (await exists(keyPath)) {
        try {
          const content = await fs.readFile(keyPath, "utf8");
          result += `=== ${keyFile} ===\n${content}\n\n`;
        } catch {
          // Skip files that can't be read
        }
      }
    }
    
    result += `\nTo get a specific file, call this tool again with the 'filePath' parameter set to one of the files listed above.`;
    
    return { 
      content: [{ 
        type: "text", 
        text: result 
      }] 
    };
  }
);

// Tool to get supported languages
server.registerTool(
  "get_supported_languages",
  {
    title: "Get Supported Languages",
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
    const languageDetails = {
      csharp: {
        name: "C#",
        runtime: ".NET Isolated Worker",
        programmingModel: "Isolated worker process with dependency injection",
        templateCount: VALID_TEMPLATES.csharp.length,
        keyFeatures: [
          "Strong typing with C# language features",
          "Isolated worker process for better performance and reliability", 
          "Built-in dependency injection support",
          "Support for .NET Core and .NET Framework",
          "Rich ecosystem of NuGet packages"
        ],
        filePatterns: [".cs files", ".template.config/template.json", "host.json", "local.settings.json"]
      },
      java: {
        name: "Java",
        runtime: "Java SE 8, 11, 17, 21",
        programmingModel: "Annotation-based with Maven build system",
        templateCount: VALID_TEMPLATES.java.length,
        keyFeatures: [
          "Annotation-based function definitions",
          "Maven project structure and dependency management",
          "Support for multiple Java versions",
          "Enterprise-ready with extensive libraries",
          "Cross-platform compatibility"
        ],
        filePatterns: ["pom.xml", "src/main/java/**/*.java", "host.json", "local.settings.json"]
      },
      python: {
        name: "Python", 
        runtime: "Python 3.8, 3.9, 3.10, 3.11",
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
        runtime: "Node.js 18, 20", 
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

    let result = `=== Azure Functions Supported Languages ===\n\n`;
    result += `Total Languages: ${VALID_LANGUAGES.length}\n\n`;

    for (const lang of VALID_LANGUAGES) {
      const details = languageDetails[lang];
      result += `## ${details.name} (${lang})\n`;
      result += `- **Runtime**: ${details.runtime}\n`;
      result += `- **Programming Model**: ${details.programmingModel}\n`;
      result += `- **Available Templates**: ${details.templateCount}\n`;
      result += `- **Key Features**:\n`;
      for (const feature of details.keyFeatures) {
        result += `  - ${feature}\n`;
      }
      result += `- **File Patterns**: ${details.filePatterns.join(", ")}\n\n`;
    }

    result += `## Template Distribution by Language:\n`;
    for (const lang of VALID_LANGUAGES) {
      const details = languageDetails[lang];
      result += `- ${details.name}: ${details.templateCount} templates\n`;
    }

    result += `\n## Usage:\n`;
    result += `Use the 'get_azure_functions_templates' tool with any of these languages:\n`;
    result += `${VALID_LANGUAGES.map(lang => `- ${lang}`).join('\n')}\n\n`;
    
    result += `Each language offers different strengths:\n`;
    result += `- **C#**: Best for enterprise applications with strong typing and .NET ecosystem\n`;
    result += `- **Java**: Ideal for enterprise Java developers with existing Maven infrastructure\n`;  
    result += `- **Python**: Perfect for data processing, ML/AI workloads, and rapid prototyping\n`;
    result += `- **TypeScript**: Excellent for web developers familiar with Node.js and modern JavaScript\n`;

    return {
      content: [{
        type: "text",
        text: result
      }]
    };
  }
);

// Tool to get templates by language with descriptions
server.registerTool(
  "get_templates_by_language",
  {
    title: "Get Templates by Language",
    description: `Browse all Azure Functions templates available for a specific programming language with detailed descriptions and use cases.

Returns organized categories of templates with:
- **Template descriptions**: What each template does and how it works
- **Use cases**: Real-world scenarios where each template is most useful  
- **Categories**: Grouped by functionality (Storage, Database, Messaging, etc.)
- **Selection guide**: Quick comparison to help choose the right template

Perfect for exploring available options and understanding Azure Functions capabilities in your preferred language before implementing a specific solution.`,
    inputSchema: {
      language: z.enum(VALID_LANGUAGES).describe(`Programming language to get templates for. Valid values: ${VALID_LANGUAGES.join(", ")}`)
    },
  },
  async (args: { language: string }) => {
    const { language } = args;
    
    // Validate language
    if (!VALID_LANGUAGES.includes(language as any)) {
      return { 
        content: [{ 
          type: "text", 
          text: `Invalid language: ${language}. Valid languages are: ${VALID_LANGUAGES.join(", ")}` 
        }], 
        isError: true 
      };
    }

    const templates = VALID_TEMPLATES[language];
    const descriptions = TEMPLATE_DESCRIPTIONS[language];
    
    let result = `=== Azure Functions Templates for ${language.toUpperCase()} ===\n\n`;
    result += `Total Templates: ${templates.length}\n\n`;

    // Group by category
    const categories: Record<string, string[]> = {};
    const uncategorizedTemplates: string[] = [];
    
    templates.forEach(template => {
      const desc = descriptions[template];
      if (desc) {
        if (!categories[desc.category]) {
          categories[desc.category] = [];
        }
        categories[desc.category].push(template);
      } else {
        // Add templates without descriptions to uncategorized list
        uncategorizedTemplates.push(template);
      }
    });
    
    // Add uncategorized templates to a special category if any exist
    if (uncategorizedTemplates.length > 0) {
      categories['Uncategorized'] = uncategorizedTemplates;
    }

    // Display templates by category
    Object.keys(categories).sort().forEach(category => {
      result += `## ${category}\n\n`;
      categories[category].forEach(template => {
        const desc = descriptions[template];
        result += `### ${template}\n`;
        if (desc) {
          result += `**Description**: ${desc.description}\n`;
          result += `**Use Case**: ${desc.useCase}\n\n`;
        } else {
          result += `**Description**: Template available (description not yet provided)\n`;
          result += `**Use Case**: See template files for implementation details\n\n`;
        }
      });
    });

    result += `## Quick Template Selection Guide\n\n`;
    result += `Choose templates based on your needs:\n\n`;
    
    Object.keys(categories).sort().forEach(category => {
      result += `**${category}**:\n`;
      categories[category].forEach(template => {
        const desc = descriptions[template];
        if (desc) {
          result += `- \`${template}\`: ${desc.description}\n`;
        } else {
          result += `- \`${template}\`: Template available (description not yet provided)\n`;
        }
      });
      result += `\n`;
    });

    result += `## Next Steps\n`;
    result += `Use the 'get_azure_functions_templates' tool with:\n`;
    result += `- language: "${language}"\n`;
    result += `- template: [one of the template names above]\n\n`;
    result += `Example: get_azure_functions_templates(language="${language}", template="${templates[0]}")\n`;

    return {
      content: [{
        type: "text",
        text: result
      }]
    };
  }
);

// Tool to get template files for a specific language and template
server.registerTool(
  "get_template_files",
  {
    title: "Get Template Files",
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
      language: z.enum(VALID_LANGUAGES).describe(`REQUIRED: Programming language. Must be exactly one of: ${VALID_LANGUAGES.map(l => `"${l}"`).join(", ")}`),
      template: z.string().describe(`REQUIRED: Exact template name. Must be one of the supported templates for the specified language. See description above for complete list of valid values for each language.`)
    },
  },
  async (args: { language: string; template: string }) => {
    const { language, template } = args;
    
    // Validate language with detailed error message
    if (!VALID_LANGUAGES.includes(language as any)) {
      return { 
        content: [{ 
          type: "text", 
          text: `INVALID LANGUAGE: "${language}"

VALID LANGUAGES (use exactly as shown):
${VALID_LANGUAGES.map(l => `- "${l}"`).join('\n')}

Please use one of the exact values above.` 
        }], 
        isError: true 
      };
    }
    
    // Validate template for the given language with detailed error message
    const validTemplatesForLang = VALID_TEMPLATES[language];
    if (!validTemplatesForLang.includes(template)) {
      return { 
        content: [{ 
          type: "text", 
          text: `INVALID TEMPLATE: "${template}" for language "${language}"

VALID TEMPLATES FOR "${language}" (use exactly as shown):
${validTemplatesForLang.map(t => `- "${t}"`).join('\n')}

Please use one of the exact template names above.` 
        }], 
        isError: true 
      };
    }

    const templateDir = path.join(TEMPLATES_ROOT, language, template);
    if (!(await exists(templateDir))) {
      return { 
        content: [{ 
          type: "text", 
          text: `ERROR: Template directory not found: ${language}/${template}

This indicates an internal error. Please verify the template exists.` 
        }], 
        isError: true 
      };
    }

    // Get all files in the template
    const allFiles = await listFilesRecursive(templateDir);
    const relativeFiles = allFiles.map(f => path.relative(templateDir, f));
    
    let result = `# Azure Functions Template: ${language}/${template}\n\n`;
    result += `**Template Structure** (${relativeFiles.length} files):\n`;
    result += `${relativeFiles.map(f => `- ${f}`).join('\n')}\n\n`;
    
    result += `**Complete Template Files**:\n\n`;
    
    // Include all files with their content
    for (let i = 0; i < relativeFiles.length; i++) {
      const filePath = relativeFiles[i];
      const fullPath = path.join(templateDir, filePath);
      
      try {
        const stat = await fs.lstat(fullPath);
        if (stat.isFile()) {
          const content = await fs.readFile(fullPath, "utf8");
          result += `## File ${i + 1}: \`${filePath}\`\n\n`;
          result += `\`\`\`${getFileExtension(filePath)}\n${content}\n\`\`\`\n\n`;
        }
      } catch (error) {
        result += `## File ${i + 1}: \`${filePath}\`\n`;
        result += `ERROR: Error reading file: ${error}\n\n`;
      }
    }
    
    result += `---\n\n`;
    result += `**Template Ready for Use**\n`;
    result += `- Language: ${language}\n`;
    result += `- Template: ${template}\n`;
    result += `- Files: ${relativeFiles.length}\n`;
    result += `- You can copy and customize these files for your Azure Functions project\n`;
    
    return { 
      content: [{ 
        type: "text", 
        text: result 
      }] 
    };
  }
);

// Helper function to get file extension for syntax highlighting
function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return FILE_EXTENSION_MAP[ext] || 'text';
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // Write errors to stderr only. Never write to stdout in stdio servers.
  console.error(err);
  process.exit(1);
});
