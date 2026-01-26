/**
 * MCP tool handler implementations.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { logger } from './logger.js';
import {
  VALID_LANGUAGES,
  VALID_TEMPLATES,
  TEMPLATE_DESCRIPTIONS,
  LANGUAGE_COMMON_FILES,
  exists,
  listFilesRecursive,
  getFileExtension,
  getKeyFilesForLanguage,
  isValidLanguage,
  isValidTemplate,
  getLanguageDetails,
  groupTemplatesByCategory,
} from './templates.js';

export { getFileExtension, getKeyFilesForLanguage, isValidLanguage as validateLanguage } from './templates.js';
export type ValidLanguage = (typeof VALID_LANGUAGES)[number];

/** Maximum file size to read (1 MB) */
export const MAX_FILE_SIZE_BYTES = 1024 * 1024;

/** Maximum total response size (5 MB) */
export const MAX_RESPONSE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Result type for handler operations.
 * Uses index signature to be compatible with MCP SDK's CallToolResult.
 */
export interface HandlerResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export { isValidTemplate as validateTemplate } from './templates.js';

/** Returns true if the path is safe (no path traversal). */
export function isPathSafe(templateDir: string, requestedPath: string): boolean {
  if (!requestedPath || requestedPath === '.' || requestedPath === '..') {
    return false;
  }

  // Normalize backslashes to forward slashes for cross-platform security
  // This prevents attacks using Windows-style paths on Linux
  const normalizedPath = requestedPath.replace(/\\/g, '/');

  // Reject absolute paths (Unix or Windows style)
  if (normalizedPath.startsWith('/') || /^[A-Za-z]:/.test(normalizedPath)) {
    return false;
  }

  const resolvedTemplateDir = path.resolve(templateDir);
  const fullPath = path.resolve(templateDir, normalizedPath);
  return fullPath.startsWith(resolvedTemplateDir + path.sep);
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
 * Formats the supported languages response
 */
export function formatSupportedLanguagesResponse(): string {
  const languageDetails = getLanguageDetails();
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
    result += `- **File Patterns**: ${details.filePatterns.join(', ')}\n\n`;
  }

  result += `## Template Distribution by Language:\n`;
  for (const lang of VALID_LANGUAGES) {
    const details = languageDetails[lang];
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
  const { categories, uncategorized } = groupTemplatesByCategory(language);

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
  if (!isValidLanguage(language)) {
    return createErrorResult(`Invalid language: ${language}. Valid languages are: ${VALID_LANGUAGES.join(', ')}`);
  }

  // Validate template for the given language
  if (!isValidTemplate(language, template)) {
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
      logger.security('Path traversal attempt detected', {
        language,
        template,
        filePath,
        templateDir,
      });
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

    if (stat.size > MAX_FILE_SIZE_BYTES) {
      logger.warn('File size exceeds limit', { filePath, size: stat.size, limit: MAX_FILE_SIZE_BYTES });
      return createErrorResult(
        `File too large: ${filePath} (${(stat.size / 1024).toFixed(1)} KB). Maximum allowed: ${MAX_FILE_SIZE_BYTES / 1024} KB`
      );
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

  if (!isValidLanguage(language)) {
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
  if (!isValidLanguage(language)) {
    return createErrorResult(`INVALID LANGUAGE: "${language}"

VALID LANGUAGES (use exactly as shown):
${VALID_LANGUAGES.map((l) => `- "${l}"`).join('\n')}

Please use one of the exact values above.`);
  }

  // Validate template for the given language with detailed error message
  if (!isValidTemplate(language, template)) {
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
  let totalSize = 0;
  for (let i = 0; i < relativeFiles.length; i++) {
    const filePath = relativeFiles[i];
    const fullPath = path.join(templateDir, filePath);

    try {
      const stat = await fs.lstat(fullPath);
      if (stat.isFile()) {
        // Check individual file size
        if (stat.size > MAX_FILE_SIZE_BYTES) {
          result += `## File ${i + 1}: \`${filePath}\`\n\n`;
          result += `*File too large (${(stat.size / 1024).toFixed(1)} KB). Use get_azure_functions_templates with filePath parameter to retrieve.*\n\n`;
          continue;
        }

        const content = await fs.readFile(fullPath, 'utf8');

        // Check if adding this file would exceed total response size
        const fileSection = `## File ${i + 1}: \`${filePath}\`\n\n\`\`\`${getFileExtension(filePath)}\n${content}\n\`\`\`\n\n`;
        if (totalSize + fileSection.length > MAX_RESPONSE_SIZE_BYTES) {
          result += `## File ${i + 1}: \`${filePath}\`\n\n`;
          result += `*Response size limit reached. Use get_azure_functions_templates with filePath parameter to retrieve remaining files.*\n\n`;
          break;
        }

        result += fileSection;
        totalSize += fileSection.length;
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
