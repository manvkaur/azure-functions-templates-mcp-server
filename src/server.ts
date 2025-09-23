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
    "BlobTrigger-CSharp-Isolated", "CosmosDbTrigger-CSharp-Isolated", "DaprPublishOutputBinding-CSharp-Isolated",
    "DaprServiceInvocationTrigger-CSharp-Isolated", "DaprTopicTrigger-CSharp-Isolated", "DurableFunctionsEntityClass-CSharp-Isolated",
    "DurableFunctionsEntityFunction-CSharp-Isolated", "DurableFunctionsOrchestration-CSharp-Isolated", "EventGridBlobTrigger-CSharp-Isolated",
    "EventGridTrigger-CSharp-Isolated", "EventHubTrigger-CSharp-Isolated", "HttpTrigger-CSharp-Isolated",
    "KustoInputBinding-CSharp-Isolated", "KustoOutputBinding-CSharp-Isolated", "MCPToolTrigger-CSharp-Isolated",
    "MySqlInputBinding-CSharp-Isolated", "MySqlOutputBinding-CSharp-Isolated", "MySqlTrigger-CSharp-Isolated",
    "QueueTrigger-CSharp-Isolated", "RabbitMQTrigger-CSharp-Isolated", "ServiceBusQueueTrigger-CSharp-Isolated",
    "ServiceBusTopicTrigger-CSharp-Isolated", "SignalRConnectionInfoHttpTrigger-CSharp-Isolated", "SqlInputBinding-CSharp-Isolated",
    "SqlTrigger-CSharp-Isolated", "TimerTrigger-CSharp-Isolated"
  ],
  java: [
    "BlobTrigger-Java", "DurableFunctions-Java", "EventGridTrigger-Java", "EventHubTrigger-Java",
    "HttpTrigger-Java", "MCPToolTrigger-Java", "QueueTrigger-Java", "ServiceBusQueueTrigger-Java",
    "ServiceBusTopicTrigger-Java", "TimerTrigger-Java"
  ],
  python: [
    "BlobInputBinding", "BlobOutputBinding", "BlobTrigger", "CosmosDBTrigger",
    "EventHubTrigger", "HttpTrigger", "McpTrigger", "QueueTrigger", "TimerTrigger"
  ],
  typescript: [
    "AuthenticationEventsTrigger-TypeScript", "BlobTrigger-TypeScript", "CosmosDbTrigger-TypeScript",
    "DurableFunctionsActivity-TypeScript", "DurableFunctionsEntity-TypeScript", "DurableFunctionsHttpStart-TypeScript",
    "DurableFunctionsOrchestrator-TypeScript", "EventGridBlobTrigger-TypeScript", "EventGridTrigger-TypeScript", 
    "EventHubTrigger-TypeScript", "HttpTrigger-TypeScript", "IoTHubTrigger-TypeScript", "KafkaOutput-TypeScript",
    "MCPToolTrigger-TypeScript", "MySqlInputBinding-Typescript", "MySqlOutputBinding-Typescript", "MySqlTrigger-Typescript",
    "QueueTrigger-TypeScript", "RabbitMQTrigger-TypeScript", "SendGrid-TypeScript", "ServiceBusQueueTrigger-TypeScript",
    "ServiceBusTopicTrigger-TypeScript", "SignalRConnectionInfoHttpTrigger-TypeScript", "SqlInputBinding-Typescript",
    "SqlOutputBinding-Typescript", "SqlTrigger-Typescript", "TimerTrigger-TypeScript"
  ]
};

// Shared template descriptions used across multiple tools
const TEMPLATE_DESCRIPTIONS: Record<string, Record<string, { description: string; category: string; useCase: string }>> = {
  csharp: {
    "BlobTrigger-CSharp-Isolated": {
      description: "Triggered by Azure Blob Storage operations (create, update, delete)",
      category: "Storage Triggers",
      useCase: "Process files uploaded to blob storage, image processing, document analysis"
    },
    "CosmosDbTrigger-CSharp-Isolated": {
      description: "Triggered by changes in Azure Cosmos DB collections using change feed",
      category: "Database Triggers", 
      useCase: "Real-time data processing, maintaining materialized views, event sourcing"
    },
    "DaprPublishOutputBinding-CSharp-Isolated": {
      description: "Publishes messages to Dapr pub/sub components",
      category: "Integration",
      useCase: "Microservices communication, event-driven architectures, decoupled messaging"
    },
    "DaprServiceInvocationTrigger-CSharp-Isolated": {
      description: "Handles Dapr service invocation requests",
      category: "Integration",
      useCase: "Service-to-service communication in microservices, API gateways, distributed apps"
    },
    "DaprTopicTrigger-CSharp-Isolated": {
      description: "Subscribes to Dapr pub/sub topics for message processing",
      category: "Integration", 
      useCase: "Event processing in microservices, asynchronous workflows, message handling"
    },
    "DurableFunctionsEntityClass-CSharp-Isolated": {
      description: "Stateful entity class for Durable Functions workflows",
      category: "Durable Functions",
      useCase: "Managing stateful objects, counters, accumulators, workflow state management"
    },
    "DurableFunctionsEntityFunction-CSharp-Isolated": {
      description: "Entity function for maintaining state in Durable Functions",
      category: "Durable Functions",
      useCase: "Stateful processing, maintaining counters, singleton patterns, state machines"
    },
    "DurableFunctionsOrchestration-CSharp-Isolated": {
      description: "Orchestrator function for complex workflow coordination",
      category: "Durable Functions", 
      useCase: "Multi-step workflows, saga patterns, long-running processes, business workflows"
    },
    "EventGridBlobTrigger-CSharp-Isolated": {
      description: "Triggered by Azure Event Grid blob events with enhanced filtering",
      category: "Storage Triggers",
      useCase: "Advanced blob processing with filtering, metadata-based routing, event-driven processing"
    },
    "EventGridTrigger-CSharp-Isolated": {
      description: "Handles Azure Event Grid custom events and system events",
      category: "Messaging",
      useCase: "Event-driven architectures, system integration, custom event processing"
    },
    "EventHubTrigger-CSharp-Isolated": {
      description: "Processes high-throughput data streams from Azure Event Hubs",
      category: "Messaging",
      useCase: "Real-time analytics, telemetry processing, IoT data streams, big data ingestion"
    },
    "HttpTrigger-CSharp-Isolated": {
      description: "RESTful HTTP API endpoints with GET/POST support",
      category: "HTTP Triggers",
      useCase: "REST APIs, webhooks, web services, serverless backends"
    },
    "KustoInputBinding-CSharp-Isolated": {
      description: "Reads data from Azure Data Explorer (Kusto) databases",
      category: "External Services",
      useCase: "Analytics queries, data exploration, reporting, time-series analysis"
    },
    "KustoOutputBinding-CSharp-Isolated": {
      description: "Writes data to Azure Data Explorer (Kusto) databases",
      category: "External Services", 
      useCase: "Analytics data ingestion, telemetry storage, time-series data collection"
    },
    "MCPToolTrigger-CSharp-Isolated": {
      description: "Model Context Protocol tool integration for AI workflows",
      category: "AI/ML",
      useCase: "AI assistant integrations, tool calling workflows, LLM integrations"
    },
    "MySqlInputBinding-CSharp-Isolated": {
      description: "Reads data from MySQL databases",
      category: "Database Triggers",
      useCase: "Data synchronization, reporting, database queries, ETL processes"
    },
    "MySqlOutputBinding-CSharp-Isolated": {
      description: "Writes data to MySQL databases", 
      category: "Database Triggers",
      useCase: "Data persistence, transaction processing, database updates, data migration"
    },
    "MySqlTrigger-CSharp-Isolated": {
      description: "Triggered by MySQL database changes",
      category: "Database Triggers",
      useCase: "Change data capture, real-time sync, audit logging, data replication"
    },
    "QueueTrigger-CSharp-Isolated": {
      description: "Processes messages from Azure Storage Queues",
      category: "Storage Triggers",
      useCase: "Asynchronous processing, work queues, task scheduling, decoupled architectures"
    },
    "RabbitMQTrigger-CSharp-Isolated": {
      description: "Consumes messages from RabbitMQ queues",
      category: "Messaging",
      useCase: "Message processing, distributed systems, event-driven apps, microservices communication"
    },
    "ServiceBusQueueTrigger-CSharp-Isolated": {
      description: "Handles Azure Service Bus queue messages with reliability",
      category: "Messaging",
      useCase: "Reliable messaging, enterprise integration, message processing with transactions"
    },
    "ServiceBusTopicTrigger-CSharp-Isolated": {
      description: "Subscribes to Azure Service Bus topics for pub/sub messaging",
      category: "Messaging",
      useCase: "Publish-subscribe patterns, event broadcasting, multi-subscriber scenarios"
    },
    "SignalRConnectionInfoHttpTrigger-CSharp-Isolated": {
      description: "Provides SignalR connection info for real-time apps",
      category: "Integration",
      useCase: "Real-time web applications, chat apps, live notifications, collaborative tools"
    },
    "SqlInputBinding-CSharp-Isolated": {
      description: "Reads data from SQL Server/Azure SQL databases",
      category: "Database Triggers",
      useCase: "Data queries, reporting, ETL processes, database integration"
    },
    "SqlTrigger-CSharp-Isolated": {
      description: "Triggered by SQL database changes using change tracking",
      category: "Database Triggers",
      useCase: "Change data capture, real-time sync, audit trails, data replication"
    },
    "TimerTrigger-CSharp-Isolated": {
      description: "Scheduled execution using CRON expressions",
      category: "Scheduling",
      useCase: "Batch processing, scheduled tasks, maintenance jobs, periodic cleanup"
    }
  },
  java: {
    "BlobTrigger-Java": {
      description: "Triggered by Azure Blob Storage operations with Maven configuration",
      category: "Storage Triggers",
      useCase: "File processing, document analysis, image processing, data ingestion"
    },
    "DurableFunctions-Java": {
      description: "Orchestration and activity functions for complex workflows",
      category: "Durable Functions",
      useCase: "Multi-step workflows, business processes, saga patterns, long-running operations"
    },
    "EventGridTrigger-Java": {
      description: "Handles Azure Event Grid events in Java runtime",
      category: "Messaging", 
      useCase: "Event-driven architectures, system integration, custom event processing"
    },
    "EventHubTrigger-Java": {
      description: "Processes streaming data from Azure Event Hubs",
      category: "Messaging",
      useCase: "Real-time analytics, IoT data processing, telemetry ingestion, stream processing"
    },
    "HttpTrigger-Java": {
      description: "RESTful API endpoints with annotation-based configuration",
      category: "HTTP Triggers",
      useCase: "REST APIs, web services, webhooks, serverless backends"
    },
    "MCPToolTrigger-Java": {
      description: "Model Context Protocol integration for AI tool workflows",
      category: "AI/ML",
      useCase: "AI assistant tools, LLM integrations, intelligent automation"
    },
    "QueueTrigger-Java": {
      description: "Processes Azure Storage Queue messages",
      category: "Storage Triggers",
      useCase: "Asynchronous processing, background jobs, task queues, decoupled processing"
    },
    "ServiceBusQueueTrigger-Java": {
      description: "Handles Service Bus queue messages with Java annotations",
      category: "Messaging",
      useCase: "Enterprise messaging, reliable message processing, transaction support"
    },
    "ServiceBusTopicTrigger-Java": {
      description: "Subscribes to Service Bus topics for messaging",
      category: "Messaging", 
      useCase: "Pub/sub patterns, event broadcasting, multi-consumer scenarios"
    },
    "TimerTrigger-Java": {
      description: "Scheduled functions using CRON expressions with Java",
      category: "Scheduling",
      useCase: "Batch processing, scheduled maintenance, periodic data processing"
    }
  },
  python: {
    "BlobInputBinding": {
      description: "Reads blob data as input binding (v2 programming model)",
      category: "Storage Triggers",
      useCase: "File processing, data ingestion, document analysis, content processing"
    },
    "BlobOutputBinding": {
      description: "Writes data to Azure Blob Storage as output binding",
      category: "Storage Triggers", 
      useCase: "File generation, data export, report creation, backup processes"
    },
    "BlobTrigger": {
      description: "Triggered by blob storage events using v2 programming model decorators",
      category: "Storage Triggers",
      useCase: "Automated file processing, image resizing, data transformation, ETL pipelines"
    },
    "CosmosDBTrigger": {
      description: "Responds to Cosmos DB document changes via change feed",
      category: "Database Triggers",
      useCase: "Real-time data sync, event sourcing, materialized views, change tracking"
    },
    "EventHubTrigger": {
      description: "Processes high-volume event streams from Event Hubs",
      category: "Messaging",
      useCase: "IoT telemetry processing, real-time analytics, stream processing, data science workflows"
    },
    "HttpTrigger": {
      description: "HTTP API endpoints with request/response handling",
      category: "HTTP Triggers", 
      useCase: "REST APIs, webhooks, web services, ML model serving, data science APIs"
    },
    "McpTrigger": {
      description: "Model Context Protocol integration for AI assistant workflows",
      category: "AI/ML",
      useCase: "AI tool integration, LLM workflows, intelligent automation, ML pipelines"
    },
    "QueueTrigger": {
      description: "Processes Azure Storage Queue messages asynchronously",
      category: "Storage Triggers",
      useCase: "Background processing, async workflows, task scheduling, data pipeline processing"
    },
    "TimerTrigger": {
      description: "Scheduled execution using CRON expressions",
      category: "Scheduling",
      useCase: "Data science jobs, model training, batch processing, automated reports"
    }
  },
  typescript: {
    "AuthenticationEventsTrigger-TypeScript": {
      description: "Handles Azure AD B2C authentication events",
      category: "Integration",
      useCase: "User authentication workflows, identity management, security events processing"
    },
    "BlobTrigger-TypeScript": {
      description: "Triggered by Azure Blob Storage operations",
      category: "Storage Triggers",
      useCase: "File processing, image manipulation, document workflows, content management"
    },
    "CosmosDbTrigger-TypeScript": {
      description: "Responds to Cosmos DB document changes", 
      category: "Database Triggers",
      useCase: "Real-time data processing, change notifications, event-driven updates"
    },
    "DurableFunctionsActivity-TypeScript": {
      description: "Activity function for Durable Functions workflows",
      category: "Durable Functions",
      useCase: "Workflow steps, business logic components, reusable processing units"
    },
    "DurableFunctionsEntity-TypeScript": {
      description: "Stateful entity for maintaining state",
      category: "Durable Functions", 
      useCase: "State management, counters, stateful objects, workflow coordination"
    },
    "DurableFunctionsHttpStart-TypeScript": {
      description: "HTTP starter for initiating orchestrations",
      category: "Durable Functions",
      useCase: "Workflow initiation, orchestration management, process triggers"
    },
    "DurableFunctionsOrchestrator-TypeScript": {
      description: "Orchestrates complex multi-step workflows",
      category: "Durable Functions",
      useCase: "Business processes, multi-step operations, workflow coordination, saga patterns"
    },
    "EventGridBlobTrigger-TypeScript": {
      description: "Enhanced blob event handling via Event Grid",
      category: "Storage Triggers",
      useCase: "Advanced file processing with filtering, event-driven workflows, metadata processing"
    },
    "EventGridTrigger-TypeScript": {
      description: "Processes Event Grid custom and system events",
      category: "Messaging",
      useCase: "Event-driven architectures, system integration, custom event handling"
    },
    "EventHubTrigger-TypeScript": {
      description: "Handles Event Hub streaming data",
      category: "Messaging", 
      useCase: "Real-time data processing, IoT telemetry, streaming analytics, live dashboards"
    },
    "HttpTrigger-TypeScript": {
      description: "RESTful API endpoints with TypeScript type safety",
      category: "HTTP Triggers",
      useCase: "Type-safe APIs, web services, serverless backends, webhook handlers"
    },
    "IoTHubTrigger-TypeScript": {
      description: "Processes IoT device messages from Azure IoT Hub",
      category: "Integration",
      useCase: "IoT data processing, device telemetry, sensor data analysis, device management"
    },
    "KafkaOutput-TypeScript": {
      description: "Produces messages to Apache Kafka topics",
      category: "Messaging",
      useCase: "Event streaming, data pipelines, message publishing, distributed systems"
    },
    "MCPToolTrigger-TypeScript": {
      description: "Model Context Protocol tool integration",
      category: "AI/ML",
      useCase: "AI assistant tools, LLM integrations, intelligent workflows, automated assistance"
    },
    "MySqlInputBinding-Typescript": {
      description: "Reads data from MySQL databases",
      category: "Database Triggers",
      useCase: "Database queries, data retrieval, reporting, ETL processes"
    },
    "MySqlOutputBinding-Typescript": {
      description: "Writes data to MySQL databases",
      category: "Database Triggers", 
      useCase: "Data persistence, database updates, transaction processing, data synchronization"
    },
    "MySqlTrigger-Typescript": {
      description: "Responds to MySQL database changes",
      category: "Database Triggers",
      useCase: "Change data capture, real-time sync, database monitoring, audit logging"
    },
    "QueueTrigger-TypeScript": {
      description: "Processes Azure Storage Queue messages",
      category: "Storage Triggers",
      useCase: "Async processing, background jobs, task queues, decoupled architectures"
    },
    "RabbitMQTrigger-TypeScript": {
      description: "Consumes RabbitMQ messages",
      category: "Messaging",
      useCase: "Message processing, distributed systems, event-driven apps, microservices"
    },
    "SendGrid-TypeScript": {
      description: "Sends emails using SendGrid service",
      category: "External Services",
      useCase: "Email notifications, transactional emails, marketing campaigns, automated messaging"
    },
    "ServiceBusQueueTrigger-TypeScript": {
      description: "Handles Service Bus queue messages",
      category: "Messaging", 
      useCase: "Enterprise messaging, reliable processing, message transactions, system integration"
    },
    "ServiceBusTopicTrigger-TypeScript": {
      description: "Subscribes to Service Bus topics",
      category: "Messaging",
      useCase: "Pub/sub messaging, event broadcasting, multi-subscriber patterns"
    },
    "SignalRConnectionInfoHttpTrigger-TypeScript": {
      description: "Provides SignalR connection info",
      category: "Integration",
      useCase: "Real-time web apps, live updates, chat applications, collaborative tools"
    },
    "SqlInputBinding-Typescript": {
      description: "Reads from SQL databases",
      category: "Database Triggers",
      useCase: "Database queries, data access, reporting, analytics, ETL processes"
    },
    "SqlOutputBinding-Typescript": {
      description: "Writes to SQL databases",
      category: "Database Triggers",
      useCase: "Data persistence, database operations, transaction processing, data updates"
    },
    "SqlTrigger-Typescript": {
      description: "Triggered by SQL database changes",
      category: "Database Triggers", 
      useCase: "Change tracking, real-time sync, database monitoring, event processing"
    },
    "TimerTrigger-TypeScript": {
      description: "Scheduled functions with CRON expressions",
      category: "Scheduling",
      useCase: "Scheduled tasks, batch processing, maintenance jobs, periodic operations"
    }
  }
};

// Helper function to generate template descriptions for tool schema
function generateTemplateDescriptions(language: string): string {
  const templates = VALID_TEMPLATES[language];
  const descriptions = TEMPLATE_DESCRIPTIONS[language];
  
  return templates.map(template => {
    const desc = descriptions[template];
    return `- ${template}: ${desc.description}`;
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
    description: `Retrieve a complete Azure Functions template with all its files for rapid development and deployment. 
    Clients can tweak the business logic as needed. Mix and Match triggers, bindings as needed.

This tool provides ready-to-use Azure Functions templates across multiple programming languages and trigger types. Each template includes:

File Patterns by Language:
- Python: function_app.py, host.json, local.settings.json, requirements.txt (Azure Functions v2 programming model with decorators)
- C#: .cs files with isolated worker model, .template.config/template.json, host.json (minimal configuration files for .NET)
- Java: pom.xml with Azure Functions Maven plugin, host.json, src/main/java structure (includes complete Maven project setup)  
- TypeScript: function.json metadata, index.ts with typed interfaces, package.json dependencies (Node.js v4 programming model)

Template Categories:
- HTTP Triggers: RESTful API endpoints with authentication levels and route handling
- Storage Triggers: Blob, Queue, and Table storage event processing  
- Database Triggers: Cosmos DB change feed, SQL triggers, MySQL integration
- Messaging: Service Bus queues/topics, Event Grid, Event Hub streaming
- Scheduling: Timer triggers with CRON expressions for batch processing
- Durable Functions: Orchestrators, activities, entities for stateful workflows
- Integration: SignalR real-time, IoT Hub, Kafka, RabbitMQ messaging
- AI/ML: Model Context Protocol (MCP) tool integration for AI assistants
- External Services: SendGrid email, Dapr microservices, Kusto analytics

Perfect for:
- Bootstrapping new Azure Functions projects with best practices
- Learning Azure Functions patterns across different languages  
- Creating production-ready serverless applications with proper configuration
- Exploring different trigger types and output bindings
- Rapid prototyping and development with complete project structure
- Understanding cross-language Azure Functions implementations

All templates include proper error handling, logging, configuration files, and follow Azure Functions best practices for each runtime.`,
    inputSchema: {
      language: z.enum(VALID_LANGUAGES).describe(`Programming language for the Azure Functions template. Valid values: ${VALID_LANGUAGES.join(", ")}`),
      template: z.string().describe(`Template name. Valid templates vary by language:
      
C# (.NET Isolated): 
${generateTemplateDescriptions('csharp')}

Java: 
${generateTemplateDescriptions('java')}

Python: 
${generateTemplateDescriptions('python')}

TypeScript: 
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
    description: `Get all supported programming languages for Azure Functions templates.
    
This tool returns a comprehensive list of all programming languages supported by the Azure Functions template server, along with details about each language's runtime, programming model, and the number of available templates.

Useful for:
- Discovering what languages are available before requesting templates
- Understanding the capabilities and characteristics of each runtime
- Planning multi-language Azure Functions projects
- Learning about Azure Functions programming models across languages`,
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
    description: `Get a detailed list of all available Azure Functions templates for a specific programming language.
    
This tool returns a comprehensive list of all templates available for the specified language, including detailed descriptions of what each template does, its use cases, and key features. Perfect for exploring available options before selecting a specific template to implement.

Useful for:
- Discovering all available templates for a specific language
- Understanding the purpose and use cases of each template
- Comparing different trigger types and bindings
- Choosing the right template for your specific requirements
- Learning about Azure Functions capabilities in your preferred language`,
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
    templates.forEach(template => {
      const desc = descriptions[template];
      if (desc) {
        if (!categories[desc.category]) {
          categories[desc.category] = [];
        }
        categories[desc.category].push(template);
      }
    });

    // Display templates by category
    Object.keys(categories).sort().forEach(category => {
      result += `## ${category}\n\n`;
      categories[category].forEach(template => {
        const desc = descriptions[template];
        result += `### ${template}\n`;
        result += `**Description**: ${desc.description}\n`;
        result += `**Use Case**: ${desc.useCase}\n\n`;
      });
    });

    result += `## Quick Template Selection Guide\n\n`;
    result += `Choose templates based on your needs:\n\n`;
    
    Object.keys(categories).sort().forEach(category => {
      result += `**${category}**:\n`;
      categories[category].forEach(template => {
        result += `- \`${template}\`: ${descriptions[template].description}\n`;
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
    description: `Get the complete file listing and structure for a specific Azure Functions template.
    
This tool returns all files and their full content for the specified language and template combination. Perfect for getting ready-to-use code that you can immediately deploy or customize.

IMPORTANT - Exact Parameter Values Required:

LANGUAGE must be one of these exact values:
- "csharp" - for C# .NET Isolated templates
- "java" - for Java templates with Maven
- "python" - for Python v2 programming model
- "typescript" - for TypeScript Node.js templates

TEMPLATE must be an exact template name from the supported list for your chosen language:

FOR LANGUAGE "csharp", use exactly one of:
${VALID_TEMPLATES.csharp.join(', ')}

FOR LANGUAGE "java", use exactly one of:
${VALID_TEMPLATES.java.join(', ')}

FOR LANGUAGE "python", use exactly one of:
${VALID_TEMPLATES.python.join(', ')}

FOR LANGUAGE "typescript", use exactly one of:
${VALID_TEMPLATES.typescript.join(', ')}

Use this tool when you want to:
- Get all files for immediate use in your project
- See the complete template structure and code
- Copy and customize a specific template
- Understand the full implementation of a template type`,
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
  switch (ext) {
    case '.cs': return 'csharp';
    case '.java': return 'java';
    case '.py': return 'python';
    case '.ts': return 'typescript';
    case '.js': return 'javascript';
    case '.json': return 'json';
    case '.xml': return 'xml';
    case '.md': return 'markdown';
    case '.txt': return 'text';
    case '.yml':
    case '.yaml': return 'yaml';
    default: return 'text';
  }
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
