/**
 * Handler logic extracted from server.ts for better testability.
 * These functions contain the core business logic that can be unit tested
 * independently of the MCP server framework.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  VALID_LANGUAGES,
  VALID_TEMPLATES,
  TEMPLATE_DESCRIPTIONS,
  LANGUAGE_COMMON_FILES,
  FILE_EXTENSION_MAP,
  exists,
  listFilesRecursive,
} from './templates.js';

// Re-export types for convenience
export type ValidLanguage = (typeof VALID_LANGUAGES)[number];

/**
 * Result type for handler operations.
 * Uses index signature to be compatible with MCP SDK's CallToolResult.
 */
export interface HandlerResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Language details for the get_supported_languages tool
 */
export interface LanguageDetails {
  name: string;
  runtime: string;
  programmingModel: string;
  templateCount: number;
  keyFeatures: string[];
  filePatterns: string[];
}

/**
 * Static language details configuration
 */
export const LANGUAGE_DETAILS: Record<ValidLanguage, LanguageDetails> = {
  csharp: {
    name: 'C#',
    runtime: '.NET Isolated Worker',
    programmingModel: 'Isolated worker process with dependency injection',
    templateCount: VALID_TEMPLATES.csharp.length,
    keyFeatures: [
      'Strong typing with C# language features',
      'Isolated worker process for better performance and reliability',
      'Built-in dependency injection support',
      'Support for .NET Core and .NET Framework',
      'Rich ecosystem of NuGet packages',
    ],
    filePatterns: ['.cs files', '.template.config/template.json', 'host.json', 'local.settings.json'],
  },
  java: {
    name: 'Java',
    runtime: 'Java SE 8, 11, 17, 21',
    programmingModel: 'Annotation-based with Maven build system',
    templateCount: VALID_TEMPLATES.java.length,
    keyFeatures: [
      'Annotation-based function definitions',
      'Maven project structure and dependency management',
      'Support for multiple Java versions',
      'Enterprise-ready with extensive libraries',
      'Cross-platform compatibility',
    ],
    filePatterns: ['pom.xml', 'src/main/java/**/*.java', 'host.json', 'local.settings.json'],
  },
  python: {
    name: 'Python',
    runtime: 'Python 3.8, 3.9, 3.10, 3.11',
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
    runtime: 'Node.js 18, 20',
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

/**
 * Validates that a language is one of the supported languages
 */
export function validateLanguage(language: string): language is ValidLanguage {
  return VALID_LANGUAGES.includes(language as ValidLanguage);
}

/**
 * Validates that a template exists for the given language
 */
export function validateTemplate(language: ValidLanguage, template: string): boolean {
  return VALID_TEMPLATES[language].includes(template);
}

/**
 * Checks for path traversal attack attempts.
 * Returns true if the path is safe, false if traversal was detected.
 */
export function isPathSafe(templateDir: string, requestedPath: string): boolean {
  // Handle empty or dot-only paths
  if (!requestedPath || requestedPath === '.' || requestedPath === '..') {
    return false;
  }

  const resolvedTemplateDir = path.resolve(templateDir);
  const fullPath = path.resolve(templateDir, requestedPath);

  // The file must be inside the template directory
  // We need to ensure it starts with templateDir + separator to prevent
  // matching /templates/csharp against /templates/csharp-evil
  return fullPath.startsWith(resolvedTemplateDir + path.sep);
}

/**
 * Gets the file extension for syntax highlighting
 */
export function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return FILE_EXTENSION_MAP[ext] || 'text';
}

/**
 * Gets the key files to include for a given language
 */
export function getKeyFilesForLanguage(language: ValidLanguage, allFiles: string[]): string[] {
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
      keyFiles.push(...csFiles.slice(0, 2));
      break;
    }
    case 'java': {
      keyFiles = ['pom.xml', 'host.json', 'local.settings.json'];
      // Include Java source files from src/main/java subdirectory
      const javaSourceFiles = allFiles.filter((f) => f.includes('src/main/java') && f.endsWith('.java'));
      keyFiles.push(...javaSourceFiles.slice(0, 2));
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
 * Creates an error result for handler responses
 */
export function createErrorResult(message: string): HandlerResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

/**
 * Creates a success result for handler responses
 */
export function createSuccessResult(text: string): HandlerResult {
  return {
    content: [{ type: 'text', text }],
  };
}

/**
 * Categorizes templates by their category for display
 */
export function categorizeTemplates(language: ValidLanguage): {
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
 * Formats the supported languages response
 */
export function formatSupportedLanguagesResponse(): string {
  let result = `=== Azure Functions Supported Languages ===\n\n`;
  result += `Total Languages: ${VALID_LANGUAGES.length}\n\n`;

  for (const lang of VALID_LANGUAGES) {
    const details = LANGUAGE_DETAILS[lang];
    result += `## ${details.name} (${lang})\n`;
    result += `- **Runtime**: ${details.runtime}\n`;
    result += `- **Programming Model**: ${details.programmingModel}\n`;
    result += `- **Available Templates**: ${details.templateCount}\n`;
    result += `- **Key Features**:\n`;
    for (const feature of details.keyFeatures) {
      result += `  - ${feature}\n`;
    }
    result += `- **File Patterns**: ${details.filePatterns.join(', ')}\n\n`;
  }

  result += `## Template Distribution by Language:\n`;
  for (const lang of VALID_LANGUAGES) {
    const details = LANGUAGE_DETAILS[lang];
    result += `- ${details.name}: ${details.templateCount} templates\n`;
  }

  result += `\n## Usage:\n`;
  result += `Use the 'get_azure_functions_templates' tool with any of these languages:\n`;
  result += `${VALID_LANGUAGES.map((lang) => `- ${lang}`).join('\n')}\n\n`;

  result += `Each language offers different strengths:\n`;
  result += `- **C#**: Best for enterprise applications with strong typing and .NET ecosystem\n`;
  result += `- **Java**: Ideal for enterprise Java developers with existing Maven infrastructure\n`;
  result += `- **Python**: Perfect for data processing, ML/AI workloads, and rapid prototyping\n`;
  result += `- **TypeScript**: Excellent for web developers familiar with Node.js and modern JavaScript\n`;

  return result;
}

/**
 * Formats the templates by language response
 */
export function formatTemplatesByLanguageResponse(language: ValidLanguage): string {
  const templates = VALID_TEMPLATES[language];
  const descriptions = TEMPLATE_DESCRIPTIONS[language];
  const { categories, uncategorized } = categorizeTemplates(language);

  // Add uncategorized to categories if any exist
  if (uncategorized.length > 0) {
    categories['Uncategorized'] = uncategorized;
  }

  let result = `=== Azure Functions Templates for ${language.toUpperCase()} ===\n\n`;
  result += `Total Templates: ${templates.length}\n\n`;

  // Display templates by category
  Object.keys(categories)
    .sort()
    .forEach((category) => {
      result += `## ${category}\n\n`;
      categories[category].forEach((template) => {
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

  Object.keys(categories)
    .sort()
    .forEach((category) => {
      result += `**${category}**:\n`;
      categories[category].forEach((template) => {
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

  return result;
}

/**
 * Arguments for the get_azure_functions_templates handler
 */
export interface GetTemplatesArgs {
  language: string;
  template: string;
  filePath?: string;
}

/**
 * Handler logic for get_azure_functions_templates tool
 */
export async function handleGetTemplates(args: GetTemplatesArgs, templatesRoot: string): Promise<HandlerResult> {
  const { language, template, filePath } = args;

  // Validate language
  if (!validateLanguage(language)) {
    return createErrorResult(`Invalid language: ${language}. Valid languages are: ${VALID_LANGUAGES.join(', ')}`);
  }

  // Validate template for the given language
  if (!validateTemplate(language, template)) {
    const validTemplatesForLang = VALID_TEMPLATES[language];
    return createErrorResult(
      `Invalid template '${template}' for language '${language}'. Valid templates for ${language} are: ${validTemplatesForLang.join(', ')}`
    );
  }

  const templateDir = path.join(templatesRoot, language, template);
  if (!(await exists(templateDir))) {
    return createErrorResult(`Template directory not found: ${language}/${template}`);
  }

  // If specific file requested, return that file
  if (filePath) {
    if (!isPathSafe(templateDir, filePath)) {
      return createErrorResult('Invalid filePath: path traversal detected');
    }

    const fullPath = path.resolve(templateDir, filePath);

    if (!(await exists(fullPath))) {
      return createErrorResult(`File not found: ${filePath}`);
    }

    const stat = await fs.lstat(fullPath);
    if (!stat.isFile()) {
      return createErrorResult(`Path is not a file: ${filePath}`);
    }

    const content = await fs.readFile(fullPath, 'utf8');
    return createSuccessResult(`=== ${filePath} ===\n${content}`);
  }

  // Return all files in the template
  const allFiles = await listFilesRecursive(templateDir);
  const relativeFiles = allFiles.map((f) => path.relative(templateDir, f));

  let result = `=== Azure Functions Template: ${language}/${template} ===\n\n`;
  result += `Files in this template:\n${relativeFiles.join('\n')}\n\n`;

  // Include content of key files based on language patterns
  const keyFiles = getKeyFilesForLanguage(language, relativeFiles);

  for (const keyFile of keyFiles) {
    const keyPath = path.join(templateDir, keyFile);
    if (await exists(keyPath)) {
      try {
        const content = await fs.readFile(keyPath, 'utf8');
        result += `=== ${keyFile} ===\n${content}\n\n`;
      } catch {
        // Skip files that can't be read
      }
    }
  }

  result += `\nTo get a specific file, call this tool again with the 'filePath' parameter set to one of the files listed above.`;

  // Add language-specific common files
  const commonFiles = LANGUAGE_COMMON_FILES[language];
  if (commonFiles && Object.keys(commonFiles).length > 0) {
    result += `\n\n=== Common Files for ${language} (include with any template) ===\n`;
    result += `The following files should be created alongside your template for production deployments:\n\n`;
    for (const [fileName, fileContent] of Object.entries(commonFiles)) {
      result += `=== ${fileName} ===\n${fileContent}\n`;
    }
  }

  return createSuccessResult(result);
}

/**
 * Handler logic for get_supported_languages tool
 */
export async function handleGetSupportedLanguages(): Promise<HandlerResult> {
  return createSuccessResult(formatSupportedLanguagesResponse());
}

/**
 * Handler logic for get_templates_by_language tool
 */
export async function handleGetTemplatesByLanguage(args: { language: string }): Promise<HandlerResult> {
  const { language } = args;

  if (!validateLanguage(language)) {
    return createErrorResult(`Invalid language: ${language}. Valid languages are: ${VALID_LANGUAGES.join(', ')}`);
  }

  return createSuccessResult(formatTemplatesByLanguageResponse(language));
}

/**
 * Arguments for the get_template_files handler
 */
export interface GetTemplateFilesArgs {
  language: string;
  template: string;
}

/**
 * Handler logic for get_template_files tool
 */
export async function handleGetTemplateFiles(
  args: GetTemplateFilesArgs,
  templatesRoot: string
): Promise<HandlerResult> {
  const { language, template } = args;

  // Validate language with detailed error message
  if (!validateLanguage(language)) {
    return createErrorResult(`INVALID LANGUAGE: "${language}"

VALID LANGUAGES (use exactly as shown):
${VALID_LANGUAGES.map((l) => `- "${l}"`).join('\n')}

Please use one of the exact values above.`);
  }

  // Validate template for the given language with detailed error message
  if (!validateTemplate(language, template)) {
    const validTemplatesForLang = VALID_TEMPLATES[language];
    return createErrorResult(`INVALID TEMPLATE: "${template}" for language "${language}"

VALID TEMPLATES FOR "${language}" (use exactly as shown):
${validTemplatesForLang.map((t) => `- "${t}"`).join('\n')}

Please use one of the exact template names above.`);
  }

  const templateDir = path.join(templatesRoot, language, template);
  if (!(await exists(templateDir))) {
    return createErrorResult(`ERROR: Template directory not found: ${language}/${template}

This indicates an internal error. Please verify the template exists.`);
  }

  // Get all files in the template
  const allFiles = await listFilesRecursive(templateDir);
  const relativeFiles = allFiles.map((f) => path.relative(templateDir, f));

  let result = `# Azure Functions Template: ${language}/${template}\n\n`;
  result += `**Template Structure** (${relativeFiles.length} files):\n`;
  result += `${relativeFiles.map((f) => `- ${f}`).join('\n')}\n\n`;

  result += `**Complete Template Files**:\n\n`;

  // Include all files with their content
  for (let i = 0; i < relativeFiles.length; i++) {
    const filePath = relativeFiles[i];
    const fullPath = path.join(templateDir, filePath);

    try {
      const stat = await fs.lstat(fullPath);
      if (stat.isFile()) {
        const content = await fs.readFile(fullPath, 'utf8');
        result += `## File ${i + 1}: \`${filePath}\`\n\n`;
        result += `\`\`\`${getFileExtension(filePath)}\n${content}\n\`\`\`\n\n`;
      }
    } catch (error) {
      result += `## File ${i + 1}: \`${filePath}\`\n`;
      result += `ERROR: Error reading file: ${error}\n\n`;
    }
  }

  // Add language-specific common files
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

  return createSuccessResult(result);
}
