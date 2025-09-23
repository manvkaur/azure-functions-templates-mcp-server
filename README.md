# Azure Functions Templates MCP Server

A Model Context Protocol (MCP) server that provides ready-to-use Azure Functions templates across multiple programming languages and trigger types. Templates are packaged with the server for easy distribution and deployment.

## Prerequisites

- Node.js 18+ (LTS recommended)

## Install and build

```powershell
# In the workspace root (d:\PyFx\templatesmcp)
npm install
npm run build
```

## Run (local/manual)

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

### Option 1: Using npx (Recommended)

```powershell
# Start the inspector with your built server
npx @modelcontextprotocol/inspector node dist/src/server.js
```

### Option 2: Install Inspector globally

```powershell
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Run the inspector
mcp-inspector node dist/src/server.js
```

The inspector will:

1. Start your MCP server as a subprocess
2. Open a web interface (usually at <http://localhost:5173>)
3. Allow you to interactively test all available tools

## Use with VS Code

You can use this MCP server with VS Code through GitHub Copilot or other MCP-compatible extensions. Here are several approaches:

### Option 1: GitHub Copilot Chat with MCP Extension

1. **Install the MCP extension for VS Code** (if available in marketplace)
2. **Configure the server** in VS Code mcp.json settings:

- Replace the path in "args" below with the absolute path to your compiled server.js file in the dist folder

```json
{
 "servers": {
  "azure-functions-template-mcp-server": {
   "type": "stdio",
   "command": "node",
   "args": ["D:\\azure-functions-templates-mcp-server\\dist\\src\\server.js"]
  }
 },
 "inputs": []
}
```

## What it provides

**Four comprehensive tools for Azure Functions template management:**

1. **`get_azure_functions_templates`**: Retrieve complete Azure Functions templates with all project files, configuration, and documentation
2. **`get_supported_languages`**: Get detailed information about all supported programming languages, their runtimes, and capabilities
3. **`get_templates_by_language`**: Explore all available templates for a specific language with descriptions, categories, and use cases
4. **`get_template_files`**: Get the complete file structure and content for a specific template

**Supported languages and templates:**

- **C# (.NET Isolated)**: 26 templates including HTTP, Blob, Timer, Service Bus, Cosmos DB, Durable Functions, and more
- **Java**: 10 templates covering core triggers and bindings  
- **Python**: 9 templates including core triggers and bindings (BlobInputBinding, BlobOutputBinding, BlobTrigger, CosmosDBTrigger, EventHubTrigger, HttpTrigger, McpTrigger, QueueTrigger, TimerTrigger)
- **TypeScript**: 27 templates with comprehensive Azure service coverage

Each template includes:

- Complete function code with proper bindings
- Configuration files (host.json, local.settings.json, etc.)
- Project files (requirements.txt, package.json, .csproj, etc.)
- Documentation and deployment instructions

Perfect for bootstrapping new Azure Functions projects, learning patterns, and rapid prototyping.

## Template Structure

This MCP server provides access to Azure Functions templates across multiple programming languages. Each language has different folder structures and file patterns:

### Python Templates

```text
HttpTrigger-Python/
├── function_app.py          # Main function code
├── blueprint.py             # Blueprint definition
├── blueprint_body.py        # Blueprint implementation
├── function_body.py         # Function implementation
├── template.json           # Template metadata
└── http_trigger_template.md # Documentation
```

### TypeScript Templates

```text
HttpTrigger-TypeScript/
├── function.json           # Function configuration
├── index.ts               # Main function code
├── metadata.json          # Template metadata
└── sample.dat            # Sample data
```

### Java Templates

```text
HttpTrigger-Java/
├── pom.xml                # Maven configuration
├── host.json             # Function host configuration
├── local.settings.json   # Local development settings
├── src/
│   └── main/
│       └── java/
│           └── com/
│               └── function/       # Standard Java package structure
│                   └── Function.java
└── target/               # Maven build output (compiled classes)
    └── classes/
        └── com/
            └── function/
                └── Function.class
```

### C# Templates

```text
HttpTrigger-CSharp-Isolated/
├── HttpTriggerCSharp.cs    # Main function code
├── host.json              # Function host configuration
├── local.settings.json    # Local development settings
└── .template.config/      # Template metadata
    ├── template.json      # Template definition
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
Template: HttpTrigger-CSharp-Isolated
```

Returns all files with complete content and syntax highlighting.

### Language-Specific Examples

**Get a Java source file:**

```text
Tool: get_azure_functions_templates
Language: java
Template: HttpTrigger-Java
FilePath: src/main/java/com/function/Function.java
```

**Get a C# template configuration:**

```text
Tool: get_azure_functions_templates
Language: csharp
Template: HttpTrigger-CSharp-Isolated
FilePath: .template.config/template.json
```

## Troubleshooting

- If the tool doesn't show up in your client, verify paths in the client config are absolute and that `npm run build` succeeded.
- Ensure no `console.log` statements are added to the server; stdout is reserved for MCP messages.
- Templates are packaged with the server, so they'll be accessible regardless of where the server is deployed.
- Use `npm run smoke` to test the server locally before configuring with Claude Desktop.
- Use MCP Inspector (`npx @modelcontextprotocol/inspector node dist/src/server.js`) for interactive testing and debugging.
