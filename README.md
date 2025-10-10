# Azure Functions Templates MCP Server

A Model Context Protocol (MCP) server that provides ready-to-use Azure Functions templates across 4 programming languages with 64+ templates covering all major Azure services and trigger types. Templates include complete project structures, configuration files, and follow modern programming patterns for rapid development and deployment.

## Features

**Multi-Language Support**: C# (.NET Isolated), Java (Maven), Python (v2 Model), TypeScript (Node.js v4)  
**Complete Templates**: Full project structure with dependencies, configuration, and best practices  
**Modern Patterns**: Latest programming models and Azure Functions runtime features  
**Rich Categories**: Web APIs, Storage, Database, Streaming, Messaging, AI/ML, Microservices, Analytics  
**Tool Integration**: Built-in support for VS Code Copilot, MCP Inspector, and AI assistants  
**Packaged Distribution**: Templates embedded with server for easy deployment and offline usage

## Prerequisites

- Node.js 18+ (LTS recommended)

## Installation

### Option 1: Install from npm (Recommended)

Install the published package globally:

```bash
npm install -g manvir-templates-mcp-server
```

Or install locally in your project:

```bash
npm install manvir-templates-mcp-server
```

### Option 2: Build from source

```powershell
# Clone and build from source
git clone https://github.com/manvkaur/azure-functions-templates-mcp-server.git
cd azure-functions-templates-mcp-server
npm install
npm run build
```

## Quick Start

### Run the server

**If installed globally:**
```bash
manvir-templates-mcp-server
```

**If installed locally:**
```bash
npx manvir-templates-mcp-server
```

**From source build:**
```powershell
node dist/src/server.js
```

This starts a stdio MCP server waiting for an MCP client connection. The server uses stdio transport and never logs to stdout (reserved for MCP protocol messages). Errors go to stderr.

## Test the server

```powershell
npm run smoke
```

Runs a simple test that calls the MCP server tools with sample requests.

## Use with MCP Inspector

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is a debugging and testing tool for MCP servers. To test this server with MCP Inspector:

### Option 1: Using the npm package (Recommended)

```bash
# If installed globally
npx @modelcontextprotocol/inspector manvir-templates-mcp-server

# If installed locally  
npx @modelcontextprotocol/inspector npx manvir-templates-mcp-server
```

### Option 2: Using built from source

```powershell
# Start the inspector with your built server
npx @modelcontextprotocol/inspector node dist/src/server.js
```

### Option 3: Install Inspector globally

```powershell
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Run with npm package
mcp-inspector manvir-templates-mcp-server

# Or run with source build
mcp-inspector node dist/src/server.js
```

The inspector will:

1. Start your MCP server as a subprocess
2. Open a web interface (usually at <http://localhost:5173>)
3. Allow you to interactively test all available tools

## Use with VS Code

You can use this MCP server with VS Code through GitHub Copilot or other MCP-compatible extensions. Here are several approaches:

### Option 1: Using npm package (Recommended)

1. **Install the package globally:**

   ```bash
   npm install -g manvir-templates-mcp-server
   ```

2. **Configure in VS Code mcp.json settings:**

   ```json
   {
     "servers": {
       "azure-functions-template-mcp-server": {
         "type": "stdio", 
         "command": "manvir-templates-mcp-server"
       }
     },
     "inputs": []
   }
   ```

### Option 2: Using local npm installation

1. **Install the package locally in your project:**

   ```bash
   npm install manvir-templates-mcp-server
   ```

2. **Configure in VS Code mcp.json settings:**

   ```json
   {
     "servers": {
       "azure-functions-template-mcp-server": {
         "type": "stdio",
         "command": "npx", 
         "args": ["manvir-templates-mcp-server"]
       }
     },
     "inputs": []
   }
   ```

### Option 3: Using built from source

1. **Build the project from source** (see Installation section)
2. **Configure in VS Code mcp.json settings:**

   ```json
   {
     "servers": {
       "azure-functions-template-mcp-server": {
         "type": "stdio",
         "command": "node",
         "args": ["D:\\path\\to\\azure-functions-templates-mcp-server\\dist\\src\\server.js"]
       }
     },
     "inputs": []
   }
   ```

   Replace `D:\\path\\to\\azure-functions-templates-mcp-server` with the actual path to your cloned repository.

## What it provides

**Four comprehensive tools for Azure Functions template management:**

1. **`get_azure_functions_templates`**: Retrieve complete Azure Functions templates with all project files, configuration, and documentation
2. **`get_supported_languages`**: Get detailed information about all supported programming languages, their runtimes, and capabilities
3. **`get_templates_by_language`**: Explore all available templates for a specific language with descriptions, categories, and use cases
4. **`get_template_files`**: Get the complete file structure and content for a specific template

**Supported languages and templates:**

- **C# (.NET Isolated Worker)**: 29 templates including HTTP, Blob, Timer, Service Bus, Cosmos DB, Durable Functions, Dapr integration, MySQL/SQL bindings, Kusto analytics, and MCP tool integration
- **Java (Maven-based)**: 14 templates covering core triggers, bindings, and Durable Functions with annotation-based configuration
- **Python (v2 Programming Model)**: 11 templates using modern decorator-based patterns including blob processing, database triggers, streaming, and AI/ML integrations
- **TypeScript (Node.js v4)**: 10 templates with full type safety covering storage, database, streaming, and real-time communication scenarios

Each template includes:

- **Complete function code** with proper bindings and error handling
- **Configuration files** (host.json, local.settings.json, etc.)
- **Project files** (requirements.txt, package.json, .csproj, pom.xml, etc.)
- **Language-specific patterns** (decorators for Python, annotations for Java, isolated worker for C#)
- **Best practices** for each runtime and programming model

**Template Categories:**

- **Web APIs**: HTTP triggers for REST endpoints and webhooks
- **Storage**: Blob triggers/bindings, Queue processing
- **Database**: Cosmos DB, SQL Server, MySQL triggers and bindings
- **Streaming**: Event Hubs for real-time data processing  
- **Messaging**: Service Bus, Event Grid, RabbitMQ integration
- **Scheduling**: Timer triggers with CRON expressions
- **Durable Functions**: Orchestrators, activities, entities for workflows
- **Microservices**: Dapr integration for distributed architectures
- **AI/ML**: Model Context Protocol (MCP) tool integration for AI assistants
- **Real-time**: SignalR for live updates and notifications
- **Analytics**: Kusto (Azure Data Explorer) for time-series analysis

Perfect for bootstrapping new Azure Functions projects, learning cross-language patterns, and rapid prototyping.

## Recent Updates

**Template Inventory Updated**: Synchronized template lists with actual available templates  
**Language-Agnostic Descriptions**: Removed language-specific implementation details from descriptions  
**Consistent Categories**: Unified template categorization across all languages  
**Accurate Counts**: Updated template counts (C#: 29, Java: 14, Python: 11, TypeScript: 10)  
**Clean Documentation**: Improved descriptions for better tool compatibility (VS Code Copilot, MCP Inspector)  
**Modern Patterns**: Reflects current Azure Functions programming models and best practices

## Template Structure

This MCP server provides access to Azure Functions templates across multiple programming languages. Each language follows modern programming models and best practices:

### Python Templates (v2 Programming Model)

```text
HttpTrigger/
├── function_app.py         # Main function code with @app decorators
├── host.json              # Function host configuration
├── local.settings.json    # Local development settings
└── requirements.txt       # Python dependencies
```

### TypeScript Templates (Node.js v4 Model)

```text
HttpTrigger/
├── src/                   # Source code directory
├── package.json           # Node.js dependencies and scripts
├── package-lock.json      # Locked dependency versions
├── tsconfig.json          # TypeScript configuration
├── host.json             # Function host configuration
└── local.settings.json   # Local development settings
```

### Java Templates (Maven-based)

```text
HttpTrigger/
├── pom.xml               # Maven configuration and dependencies
├── host.json             # Function host configuration
├── local.settings.json   # Local development settings
└── src/                  # Java source code with annotations
    └── main/
        └── java/
```

### C# Templates (.NET Isolated Worker)

```text
HttpTrigger/
├── HttpTriggerCSharp.cs  # Main function code (isolated worker)
└── .template.config/     # Template metadata for tooling
    ├── template.json     # Template definition
    └── vs-2017.3.host.json # Visual Studio configuration
```

## Project scripts

- `npm run build`: Compile TypeScript to `dist/`
- `npm start`: Run compiled server (`dist/src/server.js`)
- `npm run smoke`: Test server with sample template request
- `npm run dev`: Run with ts-node (for quick iteration; not for Claude config)
- `npm run probe`: Simple health check for the server

## Directory structure

- `src/server.ts` — MCP server implementation
- `templates/` — Azure Functions templates (packaged with server)
- `dist/` — Compiled JavaScript output
- `tools/smoke.mjs` — Simple test client

## Usage examples

### Discovering Available Languages

**Get supported languages:**

```text
Tool: get_supported_languages
```

Returns all supported languages with runtime details, programming models, and template counts.

### Exploring Templates by Language

**Get templates for a specific language:**

```text
Tool: get_templates_by_language
Language: python
```

Returns all Python templates with descriptions, categories, and use cases.

### Getting Complete Templates

**Get a complete template with all files:**

```text
Tool: get_azure_functions_templates
Language: python
Template: HttpTrigger
```

Returns all files in the template plus key configuration files.

**Get a specific file from a template:**

```text
Tool: get_azure_functions_templates
Language: python
Template: HttpTrigger
FilePath: function_app.py
```

Returns just the function_app.py file content.

### Getting Template Files (Alternative Method)

**Get complete file structure for a template:**

```text
Tool: get_template_files
Language: csharp
Template: HttpTrigger
```

Returns all files with complete content and syntax highlighting.

### Language-Specific Examples

**Get a Java Maven configuration:**

```text
Tool: get_azure_functions_templates
Language: java
Template: HttpTrigger
FilePath: pom.xml
```

**Get a C# template configuration:**

```text
Tool: get_azure_functions_templates
Language: csharp
Template: HttpTrigger
FilePath: .template.config/template.json
```

**Get TypeScript project configuration:**

```text
Tool: get_azure_functions_templates
Language: typescript
Template: HttpTrigger
FilePath: package.json
```

**Get Python requirements:**

```text
Tool: get_azure_functions_templates
Language: python
Template: HttpTrigger
FilePath: requirements.txt
```

## Troubleshooting

- If the tool doesn't show up in your client, verify paths in the client config are absolute and that `npm run build` succeeded.
- Ensure no `console.log` statements are added to the server; stdout is reserved for MCP messages.
- Templates are packaged with the server, so they'll be accessible regardless of where the server is deployed.
- Use `npm run smoke` to test the server locally before configuring with Claude Desktop.
- Use MCP Inspector (`npx @modelcontextprotocol/inspector node dist/src/server.js`) for interactive testing and debugging.
