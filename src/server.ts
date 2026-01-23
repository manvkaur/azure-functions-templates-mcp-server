#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import {
  validateTemplatesExist,
  discoverTemplates,
  VALID_LANGUAGES,
  VALID_TEMPLATES,
  TEMPLATE_DESCRIPTIONS,
  FILE_EXTENSION_MAP,
  LANGUAGE_COMMON_FILES,
  generateTemplateDescriptions,
  exists,
  listFilesRecursive,
  getFileExtension,
} from "./templates.js";

// Templates are packaged with this server
// When running from dist/, templates folder is at package root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(__dirname, "..", "..", "templates");

// Read version from package.json to keep it in sync
const require = createRequire(import.meta.url);
const packageJson = require("../../package.json");

const server = new McpServer({
  name: "azure-functions-templates",
  version: packageJson.version,
});

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
    
    // Add language-specific common files (like .funcignore)
    const commonFiles = LANGUAGE_COMMON_FILES[language];
    if (commonFiles && Object.keys(commonFiles).length > 0) {
      result += `\n\n=== Common Files for ${language} (include with any template) ===\n`;
      result += `The following files should be created alongside your template for production deployments:\n\n`;
      for (const [fileName, fileContent] of Object.entries(commonFiles)) {
        result += `=== ${fileName} ===\n${fileContent}\n`;
      }
    }
    
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
    
    // Add language-specific common files (like .funcignore)
    const commonFiles = LANGUAGE_COMMON_FILES[language];
    if (commonFiles && Object.keys(commonFiles).length > 0) {
      result += `---\n\n`;
      result += `## Common Files for ${language} (include with any template)\n\n`;
      result += `The following files should be created alongside your template for production deployments:\n\n`;
      let fileNum = relativeFiles.length;
      for (const [fileName, fileContent] of Object.entries(commonFiles)) {
        fileNum++;
        result += `## File ${fileNum}: \`${fileName}\`\n\n`;
        result += `\`\`\`text\n${fileContent}\`\`\`\n\n`;
      }
    }
    
    result += `---\n\n`;
    result += `**Template Ready for Use**\n`;
    result += `- Language: ${language}\n`;
    result += `- Template: ${template}\n`;
    result += `- Files: ${relativeFiles.length + (commonFiles ? Object.keys(commonFiles).length : 0)}\n`;
    result += `- You can copy and customize these files for your Azure Functions project\n`;
    
    return { 
      content: [{ 
        type: "text", 
        text: result 
      }] 
    };
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
    console.error(`[INFO] Template discovery: ${discovered.totalTemplates} templates found across ${discovered.languages.length} languages`);
  }
}

async function main() {
  // Validate templates exist before starting server
  await validateTemplates();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // Write errors to stderr only. Never write to stdout in stdio servers.
  console.error(err);
  process.exit(1);
});
