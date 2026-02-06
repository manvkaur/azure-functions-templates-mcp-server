# Azure Functions Create Triggers and Bindings MCP Server

[![CI](https://github.com/manvkaur/azure-functions-templates-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/manvkaur/azure-functions-templates-mcp-server/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/manvir-templates-mcp-server.svg)](https://www.npmjs.com/package/manvir-templates-mcp-server)
[![codecov](https://codecov.io/gh/manvkaur/azure-functions-templates-mcp-server/branch/main/graph/badge.svg)](https://codecov.io/gh/manvkaur/azure-functions-templates-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides ready-to-use Azure Functions templates across 4 programming languages with 68 templates covering all major Azure service bindings and trigger types. Templates include complete project structures, configuration files, and follow modern programming patterns for rapid development and deployment.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Use with VS Code](#use-with-vs-code)
- [What it provides](#what-it-provides)
- [Usage examples](#usage-examples)
- [Template Structure](#template-structure)
- [Project scripts](#project-scripts)
- [Directory structure](#directory-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

**Multi-Language Support**: C# (.NET Isolated), Java (Maven), Python (v2 Model), TypeScript (Node.js v4)  
**Complete Templates**: Full project structure with dependencies, configuration, and best practices  
**Modern Patterns**: Latest programming models and Azure Functions runtime features  
**Rich Categories**: Web APIs, Storage, Database, Streaming, Messaging, AI/ML, Microservices, Analytics  
**Tool Integration**: Built-in support for VS Code Copilot, MCP Inspector, and AI assistants  
**Packaged Distribution**: Templates embedded with server for easy deployment and offline usage

## Prerequisites

- **Node.js 18+ (LTS recommended)**: Required for running the MCP server
- **npm**: Package manager (included with Node.js)
- **MCP Client**: Such as VS Code with Copilot, or MCP Inspector
- **Git**: For cloning the repository (if building from source)

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

**Verify installation:**

#### Verify global installation

```bash
npm list -g manvir-templates-mcp-server
```

#### Or verify local installation

```bash
npm list manvir-templates-mcp-server
```

#### Or check that the executable is available in your PATH

```bash
which manvir-templates-mcp-server
```

#### Run a smoke test to verify installation

```bash
npm run smoke
```

#### Or run the probe test

```bash
npm run probe
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
       "azure-functions-create-triggers-bindings": {
         "type": "stdio",
         "command": "manvir-templates-mcp-server"
       }
     }
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
       "azure-functions-create-triggers-bindings": {
         "type": "stdio",
         "command": "npx",
         "args": ["manvir-templates-mcp-server"]
       }
     }
   }
   ```

### Option 3: Using built from source

1. **Build the project from source** (see Installation section)
2. **Configure in VS Code mcp.json settings:**

   ```json
   {
     "servers": {
       "azure-functions-create-triggers-bindings": {
         "type": "stdio",
         "command": "node",
         "args": ["D:\\path\\to\\azure-functions-templates-mcp-server\\dist\\src\\server.js"]
       }
     }
   }
   ```

   Replace `D:\\path\\to\\azure-functions-templates-mcp-server` with the actual path to your cloned repository.

### Improving Discoverability for Copilot

By default, Copilot may not automatically use MCP server tools. To ensure Copilot uses this server when working with Azure Functions, add a prompt instruction file:

#### Option A: VS Code Prompt File (Recommended)

Create `.github/copilot-instructions.md` in your project:

```markdown
When creating, modifying, or adding Azure Functions code, triggers, or bindings:
1. ALWAYS use the `azure-functions-create-triggers-bindings` MCP server tools
2. Start with `get_languages_list` to see supported languages
3. Call `get_project_template` to get project scaffolding files
4. Call `get_azure_functions_templates_list` to browse available triggers and bindings
5. Call `get_azure_functions_template` to get ready-to-use function code
6. Do NOT write Azure Function code from scratch
```

#### Option B: VS Code User Prompt File

Create a prompt file in VS Code's user settings directory:

- Windows: `%APPDATA%\Code\User\prompts\azure-functions.md`
- macOS: `~/Library/Application Support/Code/User/prompts/azure-functions.md`
- Linux: `~/.config/Code/User/prompts/azure-functions.md`

```markdown
---
applyTo: '**/*.{cs,java,py,ts}'
---
When working with Azure Functions code, use the azure-functions-create-triggers-bindings MCP server.
Start with get_languages_list, then get_project_template, then get_azure_functions_templates_list.
Always fetch templates using get_azure_functions_template instead of writing function code manually.
```

## What it provides

**Four composable tools for Azure Functions template management:**

1. **`get_languages_list`**: Get the list of supported languages with runtime versions and capabilities
2. **`get_project_template`**: Get project initialization files (host.json, package.json, pom.xml, etc.) with configurable runtime parameters
3. **`get_azure_functions_templates_list`**: Get all available function templates for a specific language with descriptions and categories
4. **`get_azure_functions_template`**: Get the complete source code for a specific function template, plus required app settings and packages

**Supported languages and templates:**

- **C# (.NET Isolated Worker)**: 28 templates including HTTP, Blob, Timer, Service Bus, Cosmos DB, Durable Functions, Dapr integration, MySQL/SQL bindings, MCP tool and resource triggers
- **Java (Maven-based)**: 15 templates covering core triggers, bindings, Durable Functions, and MCP tool trigger with annotation-based configuration
- **Python (v2 Programming Model)**: 13 templates using modern decorator-based patterns including blob processing, database triggers, streaming, AI/ML integrations, and generic trigger support
- **TypeScript (Node.js v4)**: 12 templates with full type safety covering storage, database, streaming, MCP integration, and real-time communication scenarios

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

Perfect for bootstrapping new Azure Functions projects, learning cross-language patterns, and rapid prototyping.

## Recent Updates

**Runtime Version Parameters**: Added optional `runtimeVersion` parameter to `get_project_template` and `get_azure_functions_template` tools for Java and TypeScript. Automatically replaces version placeholders in templates.  
**Java 8 Support**: Correctly converts Java 8 to Maven-compatible `1.8` format  
**Template Inventory Updated**: Synchronized template lists with actual available templates  
**Language-Agnostic Descriptions**: Removed language-specific implementation details from descriptions  
**Consistent Categories**: Unified template categorization across all languages  
**Accurate Counts**: Updated template counts (C#: 28, Java: 15, Python: 13, TypeScript: 12)  
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
- `npm run dev`: Run with ts-node (for quick iteration)
- `npm run probe`: Simple health check for the server

## Directory structure

- `src/server.ts` — MCP server implementation
- `templates/` — Azure Functions templates (packaged with server)
- `dist/` — Compiled JavaScript output
- `tools/smoke.mjs` — Simple test client

## Usage examples

### Workflow: Create a New Azure Functions Project

The tools are designed to be used in sequence:

1. **Discover languages** → `get_languages_list`
2. **Initialize project** → `get_project_template` (with runtime parameters)
3. **Browse templates** → `get_azure_functions_templates_list`
4. **Add functions** → `get_azure_functions_template` (with required settings)

### Discovering Available Languages

**Get supported languages:**

```text
Tool: get_languages_list
```

Returns all supported languages with runtime details, programming models, and template counts.

### Initializing a Project

**Get project files for Python:**

```text
Tool: get_project_template
Language: python
```

**Get project files for TypeScript with specific Node.js version:**

```text
Tool: get_project_template
Language: typescript
runtimeVersion: "20"
```

**Get project files for Java with specific Java version:**

```text
Tool: get_project_template
Language: java
runtimeVersion: "21"
```

Returns all project initialization files (host.json, requirements.txt, package.json, pom.xml, etc.) with the specified runtime parameters applied.

### Exploring Templates by Language

**Get templates for a specific language:**

```text
Tool: get_azure_functions_templates_list
Language: python
```

Returns all Python templates with descriptions, categories, and use cases.

### Getting Function Templates

**Get a complete function template:**

```text
Tool: get_azure_functions_template
Language: python
Template: HttpTrigger
```

Returns the function source code, plus any required app settings and additional packages.

### Language-Specific Examples

**Get a Java Cosmos DB trigger with specific JDK version:**

```text
Tool: get_azure_functions_template
Language: java
Template: CosmosDBTrigger
runtimeVersion: "17"
```

**Get a C# Durable Functions orchestration:**

```text
Tool: get_azure_functions_template
Language: csharp
Template: DurableFunctionsOrchestration
```

**Get a TypeScript Blob trigger with specific Node.js version:**

```text
Tool: get_azure_functions_template
Language: typescript
Template: BlobTrigger
runtimeVersion: "22"
```

## Troubleshooting

### Common Issues

#### Server Not Starting

- **Problem**: Command not found or server won't start
- **Solution**:
  - Verify installation: `npm list -g manvir-templates-mcp-server`
  - Reinstall if needed: `npm install -g manvir-templates-mcp-server`
  - Check Node.js version: `node --version` (requires 18+)

#### Tools Not Available in MCP Client

- **Problem**: MCP client doesn't show the Azure Functions tools
- **Solution**:
  - Verify server configuration in your MCP client settings
  - Check that paths in client config are absolute
  - Ensure `npm run build` succeeded if building from source
  - Test with MCP Inspector first: `npx @modelcontextprotocol/inspector manvir-templates-mcp-server`

#### Template Retrieval Errors

- **Problem**: Error when requesting templates
- **Solution**:
  - Verify language parameter is one of: `csharp`, `java`, `python`, `typescript`
  - Check template name matches exactly (case-sensitive)
  - Use `get_azure_functions_templates_list` to see valid template names

#### Performance Issues

- **Problem**: Slow response times
- **Solution**:
  - Templates are packaged with the server for fast access
  - Use `get_azure_functions_template` to get just the function code you need
  - Project files are fetched separately via `get_project_template`

### Debug Mode

Run the smoke test to verify functionality:

```bash
npm run smoke
```

Use MCP Inspector for interactive debugging:

```bash
npx @modelcontextprotocol/inspector manvir-templates-mcp-server
```

### Support

- **Issues**: Report bugs at [GitHub Issues](https://github.com/manvkaur/azure-functions-templates-mcp-server/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/manvkaur/azure-functions-templates-mcp-server/discussions)
- **Documentation**: Full documentation available in the [repository](https://github.com/manvkaur/azure-functions-templates-mcp-server)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

```bash
git clone https://github.com/manvkaur/azure-functions-templates-mcp-server.git
cd azure-functions-templates-mcp-server
npm install
npm run build
npm test
```

### Development Notes

- **Stdout Reserved**: Never add `console.log` statements; stdout is reserved for MCP protocol messages
- **Error Handling**: All errors go to stderr, tool errors use `isError: true` flag
- **Template Packaging**: Templates are embedded in the package for offline usage
- **Protocol Compliance**: Server implements MCP specification correctly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
