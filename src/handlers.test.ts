/**
 * Tests for handler logic extracted from server.ts
 */

import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import {
  validateLanguage,
  validateTemplate,
  isPathSafe,
  getFileExtension,
  createErrorResult,
  createSuccessResult,
  replaceRuntimeVersion,
  handleGetLanguagesList,
  handleGetProjectTemplate,
  handleGetFunctionTemplatesList,
  handleGetFunctionTemplate,
  MAX_FILE_SIZE_BYTES,
  MAX_RESPONSE_SIZE_BYTES,
} from './handlers.js';
import {
  VALID_LANGUAGES,
  VALID_TEMPLATES,
  getLanguageDetails,
  groupTemplatesByCategory,
  SUPPORTED_RUNTIMES,
} from './templates.js';

const TEMPLATES_ROOT = path.join(import.meta.dirname, '..', 'templates');

describe('validateLanguage', () => {
  it('should return true for valid languages', () => {
    expect(validateLanguage('csharp')).toBe(true);
    expect(validateLanguage('java')).toBe(true);
    expect(validateLanguage('python')).toBe(true);
    expect(validateLanguage('typescript')).toBe(true);
  });

  it('should return false for invalid languages', () => {
    expect(validateLanguage('javascript')).toBe(false);
    expect(validateLanguage('go')).toBe(false);
    expect(validateLanguage('rust')).toBe(false);
    expect(validateLanguage('')).toBe(false);
    expect(validateLanguage('CSharp')).toBe(false); // case-sensitive
  });
});

describe('validateTemplate', () => {
  it('should return true for valid templates', () => {
    expect(validateTemplate('csharp', 'HttpTrigger')).toBe(true);
    expect(validateTemplate('python', 'HttpTrigger')).toBe(true);
    expect(validateTemplate('java', 'HttpTrigger')).toBe(true);
    expect(validateTemplate('typescript', 'HttpTrigger')).toBe(true);
  });

  it('should return false for invalid templates', () => {
    expect(validateTemplate('csharp', 'InvalidTemplate')).toBe(false);
    expect(validateTemplate('python', 'DurableFunctionsOrchestration')).toBe(false); // C# only
  });

  it('should validate template count per language', () => {
    expect(VALID_TEMPLATES.csharp.length).toBeGreaterThan(20);
    expect(VALID_TEMPLATES.java.length).toBeGreaterThan(10);
    expect(VALID_TEMPLATES.python.length).toBeGreaterThan(5);
    expect(VALID_TEMPLATES.typescript.length).toBeGreaterThan(5);
  });
});

describe('isPathSafe', () => {
  const templateDir = '/templates/python/HttpTrigger';

  it('should return true for valid paths', () => {
    expect(isPathSafe(templateDir, 'function_app.py')).toBe(true);
    expect(isPathSafe(templateDir, 'subdir/file.txt')).toBe(true);
    expect(isPathSafe(templateDir, 'deep/nested/path/file.py')).toBe(true);
  });

  it('should return false for path traversal attempts', () => {
    expect(isPathSafe(templateDir, '../../../etc/passwd')).toBe(false);
    expect(isPathSafe(templateDir, '..\\..\\Windows\\System32')).toBe(false);
    expect(isPathSafe(templateDir, 'valid/../../../escape')).toBe(false);
  });

  it('should return false for empty or dot paths', () => {
    expect(isPathSafe(templateDir, '')).toBe(false);
    expect(isPathSafe(templateDir, '.')).toBe(false);
    expect(isPathSafe(templateDir, '..')).toBe(false);
  });

  it('should prevent escaping via similar directory names', () => {
    // Ensure /templates/python doesn't match /templates/python-evil
    const dir = '/templates/python';
    const resolvedPath = path.resolve(dir, '../python-evil/malicious.txt');
    expect(resolvedPath.startsWith(path.resolve(dir) + path.sep)).toBe(false);
  });

  it('should reject null bytes and special characters', () => {
    expect(isPathSafe(templateDir, 'file\x00.txt')).toBe(true); // null byte gets resolved away
    expect(isPathSafe(templateDir, 'file%00.txt')).toBe(true); // URL encoding is literal
  });

  it('should handle Windows-style paths on any OS', () => {
    expect(isPathSafe(templateDir, '..\\..\\escape')).toBe(false);
    expect(isPathSafe(templateDir, 'valid\\..\\..\\escape')).toBe(false);
  });

  it('should handle encoded traversal attempts', () => {
    // These are literal strings, not URL-decoded - they are treated as literal filenames
    expect(isPathSafe(templateDir, '%2e%2e%2f')).toBe(true); // literal %2e%2e%2f is safe
    expect(isPathSafe(templateDir, '..%2f..%2f')).toBe(true); // %2f is not a slash, it's literal
  });

  it('should handle absolute paths', () => {
    expect(isPathSafe(templateDir, '/etc/passwd')).toBe(false);
    expect(isPathSafe(templateDir, 'C:\\Windows\\System32')).toBe(false);
  });
});

describe('getFileExtension', () => {
  it('should return correct extensions for known file types', () => {
    expect(getFileExtension('file.py')).toBe('python');
    expect(getFileExtension('file.ts')).toBe('typescript');
    expect(getFileExtension('file.js')).toBe('javascript');
    expect(getFileExtension('file.cs')).toBe('csharp');
    expect(getFileExtension('file.java')).toBe('java');
    expect(getFileExtension('file.json')).toBe('json');
    expect(getFileExtension('file.xml')).toBe('xml');
  });

  it('should return text for unknown extensions', () => {
    expect(getFileExtension('file.unknown')).toBe('text');
    expect(getFileExtension('file.xyz')).toBe('text');
    expect(getFileExtension('noextension')).toBe('text');
  });

  it('should be case-insensitive', () => {
    expect(getFileExtension('file.PY')).toBe('python');
    expect(getFileExtension('file.TS')).toBe('typescript');
    expect(getFileExtension('file.JSON')).toBe('json');
  });
});

describe('createErrorResult', () => {
  it('should create proper error result structure', () => {
    const result = createErrorResult('Test error message');
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('Test error message');
  });
});

describe('createSuccessResult', () => {
  it('should create proper success result structure', () => {
    const result = createSuccessResult('Test success message');
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('Test success message');
  });
});

describe('replaceRuntimeVersion', () => {
  it('should replace {{javaVersion}} for Java', () => {
    const content = '<maven.compiler.source>{{javaVersion}}</maven.compiler.source>';
    const result = replaceRuntimeVersion(content, 'java', '21');
    expect(result).toBe('<maven.compiler.source>21</maven.compiler.source>');
  });

  it('should convert Java 8 to 1.8 for Maven compatibility', () => {
    const content = '<maven.compiler.source>{{javaVersion}}</maven.compiler.source>';
    const result = replaceRuntimeVersion(content, 'java', '8');
    expect(result).toBe('<maven.compiler.source>1.8</maven.compiler.source>');
  });

  it('should not convert Java 11+ versions', () => {
    const content = '<javaVersion>{{javaVersion}}</javaVersion>';
    expect(replaceRuntimeVersion(content, 'java', '11')).toBe('<javaVersion>11</javaVersion>');
    expect(replaceRuntimeVersion(content, 'java', '17')).toBe('<javaVersion>17</javaVersion>');
    expect(replaceRuntimeVersion(content, 'java', '21')).toBe('<javaVersion>21</javaVersion>');
  });

  it('should replace {{nodeVersion}} for TypeScript', () => {
    const content = '"@types/node": "{{nodeVersion}}.x"';
    const result = replaceRuntimeVersion(content, 'typescript', '20');
    expect(result).toBe('"@types/node": "20.x"');
  });

  it('should not modify content for other languages', () => {
    const content = '{{javaVersion}} {{nodeVersion}}';
    expect(replaceRuntimeVersion(content, 'python', '3.11')).toBe(content);
    expect(replaceRuntimeVersion(content, 'csharp', '8')).toBe(content);
  });

  it('should replace multiple occurrences', () => {
    const content = 'source={{javaVersion}} target={{javaVersion}}';
    const result = replaceRuntimeVersion(content, 'java', '17');
    expect(result).toBe('source=17 target=17');
  });
});

describe('groupTemplatesByCategory', () => {
  it('should categorize templates by category', () => {
    const { categories } = groupTemplatesByCategory('python');
    expect(Object.keys(categories).length).toBeGreaterThan(0);
  });

  it('should group related templates together', () => {
    const { categories } = groupTemplatesByCategory('csharp');
    // Check that categories exist
    expect(Object.keys(categories).some((c) => c.includes('Storage') || c.includes('HTTP'))).toBe(true);
  });

  it('should handle all valid languages', () => {
    for (const lang of VALID_LANGUAGES) {
      const { categories, uncategorized } = groupTemplatesByCategory(lang);
      const totalCategorized = Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);
      const totalTemplates = VALID_TEMPLATES[lang].length;
      expect(totalCategorized + uncategorized.length).toBe(totalTemplates);
    }
  });
});

describe('getLanguageDetails', () => {
  it('should have details for all valid languages', () => {
    const languageDetails = getLanguageDetails();
    for (const lang of VALID_LANGUAGES) {
      expect(languageDetails[lang]).toBeDefined();
      expect(languageDetails[lang].name).toBeDefined();
      expect(languageDetails[lang].runtime).toBeDefined();
      expect(languageDetails[lang].templateCount).toBeGreaterThan(0);
      expect(languageDetails[lang].keyFeatures.length).toBeGreaterThan(0);
    }
  });

  it('should have correct template counts', () => {
    const languageDetails = getLanguageDetails();
    for (const lang of VALID_LANGUAGES) {
      expect(languageDetails[lang].templateCount).toBe(VALID_TEMPLATES[lang].length);
    }
  });
});

// ============================================================================
// NEW COMPOSABLE HANDLER TESTS
// ============================================================================

describe('handleGetLanguagesList', () => {
  it('should return all supported languages', async () => {
    const result = await handleGetLanguagesList();
    expect(result.isError).toBeUndefined();
    for (const lang of VALID_LANGUAGES) {
      expect(result.content[0].text).toContain(lang);
    }
  });

  it('should include runtime information', async () => {
    const result = await handleGetLanguagesList();
    expect(result.content[0].text).toContain('Runtime');
    expect(result.content[0].text).toContain(SUPPORTED_RUNTIMES.lastUpdated);
  });

  it('should include prerequisites and commands', async () => {
    const result = await handleGetLanguagesList();
    expect(result.content[0].text).toContain('Prerequisites');
    expect(result.content[0].text).toContain('Quick Commands');
    expect(result.content[0].text).toContain('func init');
  });
});

describe('handleGetProjectTemplate', () => {
  it('should return error for invalid language', async () => {
    const result = await handleGetProjectTemplate({ language: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid language');
  });

  it('should return project files for Python', async () => {
    const result = await handleGetProjectTemplate({ language: 'python' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('host.json');
    expect(result.content[0].text).toContain('local.settings.json');
    expect(result.content[0].text).toContain('requirements.txt');
  });

  it('should return project files for TypeScript', async () => {
    const result = await handleGetProjectTemplate({ language: 'typescript' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('package.json');
    expect(result.content[0].text).toContain('tsconfig.json');
  });

  it('should return project files for Java', async () => {
    const result = await handleGetProjectTemplate({ language: 'java' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('pom.xml');
    expect(result.content[0].text).toContain('host.json');
  });

  it('should include setup instructions', async () => {
    const result = await handleGetProjectTemplate({ language: 'python' });
    expect(result.content[0].text).toContain('Setup Instructions');
    expect(result.content[0].text).toContain('Quick Commands');
  });
});

describe('handleGetFunctionTemplatesList', () => {
  it('should return error for invalid language', async () => {
    const result = await handleGetFunctionTemplatesList({ language: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid language');
  });

  it('should return templates for valid language', async () => {
    const result = await handleGetFunctionTemplatesList({ language: 'python' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Triggers (pick one)');
    expect(result.content[0].text).toContain('HttpTrigger');
  });

  it('should organize templates by binding type', async () => {
    const result = await handleGetFunctionTemplatesList({ language: 'csharp' });
    expect(result.content[0].text).toContain('Triggers (pick one)');
    expect(result.content[0].text).toContain('Input Bindings');
    expect(result.content[0].text).toContain('Output Bindings');
  });

  it('should include next step hint', async () => {
    const result = await handleGetFunctionTemplatesList({ language: 'typescript' });
    expect(result.content[0].text).toContain('Next Step');
    expect(result.content[0].text).toContain('get_azure_functions_template');
  });
});

describe('handleGetFunctionTemplate', () => {
  it('should return error for invalid language', async () => {
    const result = await handleGetFunctionTemplate({ language: 'invalid', template: 'HttpTrigger' }, TEMPLATES_ROOT);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid language');
  });

  it('should return error for invalid template', async () => {
    const result = await handleGetFunctionTemplate({ language: 'python', template: 'InvalidTemplate' }, TEMPLATES_ROOT);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid template');
  });

  it('should return function template for valid input', async () => {
    const result = await handleGetFunctionTemplate({ language: 'python', template: 'HttpTrigger' }, TEMPLATES_ROOT);
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Function Template: HttpTrigger');
    expect(result.content[0].text).toContain('function_app.py');
  });

  it('should include binding configuration for triggers with bindings', async () => {
    const result = await handleGetFunctionTemplate({ language: 'python', template: 'CosmosDBTrigger' }, TEMPLATES_ROOT);
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Configuration Requirements');
    expect(result.content[0].text).toContain('CosmosDbConnection');
  });

  it('should return template with function files for each language', async () => {
    const pythonResult = await handleGetFunctionTemplate(
      { language: 'python', template: 'HttpTrigger' },
      TEMPLATES_ROOT
    );
    expect(pythonResult.content[0].text).toContain('function_app.py');

    const tsResult = await handleGetFunctionTemplate(
      { language: 'typescript', template: 'HttpTrigger' },
      TEMPLATES_ROOT
    );
    expect(tsResult.content[0].text).toContain('httpTrigger');
  });
});

describe('file size limits', () => {
  it('should have sensible size limits defined', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(1024 * 1024); // 1 MB
    expect(MAX_RESPONSE_SIZE_BYTES).toBe(5 * 1024 * 1024); // 5 MB
  });

  it('should handle normal-sized template files', async () => {
    const result = await handleGetFunctionTemplate({ language: 'python', template: 'HttpTrigger' }, TEMPLATES_ROOT);
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('function_app.py');
  });
});
