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
• HTTP Triggers: RESTful API endpoints with authentication levels and route handling
• Storage Triggers: Blob, Queue, and Table storage event processing  
• Database Triggers: Cosmos DB change feed, SQL triggers, MySQL integration
• Messaging: Service Bus queues/topics, Event Grid, Event Hub streaming
• Scheduling: Timer triggers with CRON expressions for batch processing
• Durable Functions: Orchestrators, activities, entities for stateful workflows
• Integration: SignalR real-time, IoT Hub, Kafka, RabbitMQ messaging
• AI/ML: Model Context Protocol (MCP) tool integration for AI assistants
• External Services: SendGrid email, Dapr microservices, Kusto analytics

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
- BlobTrigger-CSharp-Isolated: Triggered by Azure Blob Storage operations (create, update, delete)
- CosmosDbTrigger-CSharp-Isolated: Triggered by changes in Azure Cosmos DB collections using change feed
- DaprPublishOutputBinding-CSharp-Isolated: Publishes messages to Dapr pub/sub components
- DaprServiceInvocationTrigger-CSharp-Isolated: Handles Dapr service invocation requests
- DaprTopicTrigger-CSharp-Isolated: Subscribes to Dapr pub/sub topics for message processing
- DurableFunctionsEntityClass-CSharp-Isolated: Stateful entity class for Durable Functions workflows
- DurableFunctionsEntityFunction-CSharp-Isolated: Entity function for maintaining state in Durable Functions
- DurableFunctionsOrchestration-CSharp-Isolated: Orchestrator function for complex workflow coordination
- EventGridBlobTrigger-CSharp-Isolated: Triggered by Azure Event Grid blob events with enhanced filtering
- EventGridTrigger-CSharp-Isolated: Handles Azure Event Grid custom events and system events
- EventHubTrigger-CSharp-Isolated: Processes high-throughput data streams from Azure Event Hubs
- HttpTrigger-CSharp-Isolated: RESTful HTTP API endpoints with GET/POST support
- KustoInputBinding-CSharp-Isolated: Reads data from Azure Data Explorer (Kusto) databases
- KustoOutputBinding-CSharp-Isolated: Writes data to Azure Data Explorer (Kusto) databases
- MCPToolTrigger-CSharp-Isolated: Model Context Protocol tool integration for AI workflows
- MySqlInputBinding-CSharp-Isolated: Reads data from MySQL databases
- MySqlOutputBinding-CSharp-Isolated: Writes data to MySQL databases
- MySqlTrigger-CSharp-Isolated: Triggered by MySQL database changes
- QueueTrigger-CSharp-Isolated: Processes messages from Azure Storage Queues
- RabbitMQTrigger-CSharp-Isolated: Consumes messages from RabbitMQ queues
- ServiceBusQueueTrigger-CSharp-Isolated: Handles Azure Service Bus queue messages with reliability
- ServiceBusTopicTrigger-CSharp-Isolated: Subscribes to Azure Service Bus topics for pub/sub messaging
- SignalRConnectionInfoHttpTrigger-CSharp-Isolated: Provides SignalR connection info for real-time apps
- SqlInputBinding-CSharp-Isolated: Reads data from SQL Server/Azure SQL databases
- SqlTrigger-CSharp-Isolated: Triggered by SQL database changes using change tracking
- TimerTrigger-CSharp-Isolated: Scheduled execution using CRON expressions

Java: 
- BlobTrigger-Java: Triggered by Azure Blob Storage operations with Maven configuration
- DurableFunctions-Java: Orchestration and activity functions for complex workflows
- EventGridTrigger-Java: Handles Azure Event Grid events in Java runtime
- EventHubTrigger-Java: Processes streaming data from Azure Event Hubs
- HttpTrigger-Java: RESTful API endpoints with annotation-based configuration
- MCPToolTrigger-Java: Model Context Protocol integration for AI tool workflows
- QueueTrigger-Java: Processes Azure Storage Queue messages
- ServiceBusQueueTrigger-Java: Handles Service Bus queue messages with Java annotations
- ServiceBusTopicTrigger-Java: Subscribes to Service Bus topics for messaging
- TimerTrigger-Java: Scheduled functions using CRON expressions with Java

Python: 
- BlobInputBinding: Reads blob data as input binding (v2 programming model)
- BlobOutputBinding: Writes data to Azure Blob Storage as output binding
- BlobTrigger: Triggered by blob storage events using v2 programming model decorators
- CosmosDBTrigger: Responds to Cosmos DB document changes via change feed
- EventHubTrigger: Processes high-volume event streams from Event Hubs
- HttpTrigger: HTTP API endpoints with request/response handling
- McpTrigger: Model Context Protocol integration for AI assistant workflows
- QueueTrigger: Processes Azure Storage Queue messages asynchronously
- TimerTrigger: Scheduled execution using CRON expressions

TypeScript: 
- AuthenticationEventsTrigger-TypeScript: Handles Azure AD B2C authentication events
- BlobTrigger-TypeScript: Triggered by Azure Blob Storage operations
- CosmosDbTrigger-TypeScript: Responds to Cosmos DB document changes
- DurableFunctionsActivity-TypeScript: Activity function for Durable Functions workflows
- DurableFunctionsEntity-TypeScript: Stateful entity for maintaining state
- DurableFunctionsHttpStart-TypeScript: HTTP starter for initiating orchestrations
- DurableFunctionsOrchestrator-TypeScript: Orchestrates complex multi-step workflows
- EventGridBlobTrigger-TypeScript: Enhanced blob event handling via Event Grid
- EventGridTrigger-TypeScript: Processes Event Grid custom and system events
- EventHubTrigger-TypeScript: Handles Event Hub streaming data
- HttpTrigger-TypeScript: RESTful API endpoints with TypeScript type safety
- IoTHubTrigger-TypeScript: Processes IoT device messages from Azure IoT Hub
- KafkaOutput-TypeScript: Produces messages to Apache Kafka topics
- MCPToolTrigger-TypeScript: Model Context Protocol tool integration
- MySqlInputBinding-Typescript: Reads data from MySQL databases
- MySqlOutputBinding-Typescript: Writes data to MySQL databases
- MySqlTrigger-Typescript: Responds to MySQL database changes
- QueueTrigger-TypeScript: Processes Azure Storage Queue messages
- RabbitMQTrigger-TypeScript: Consumes RabbitMQ messages
- SendGrid-TypeScript: Sends emails using SendGrid service
- ServiceBusQueueTrigger-TypeScript: Handles Service Bus queue messages
- ServiceBusTopicTrigger-TypeScript: Subscribes to Service Bus topics
- SignalRConnectionInfoHttpTrigger-TypeScript: Provides SignalR connection info
- SqlInputBinding-Typescript: Reads from SQL databases
- SqlOutputBinding-Typescript: Writes to SQL databases
- SqlTrigger-Typescript: Triggered by SQL database changes
- TimerTrigger-TypeScript: Scheduled functions with CRON expressions`),
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // Write errors to stderr only. Never write to stdout in stdio servers.
  console.error(err);
  process.exit(1);
});
