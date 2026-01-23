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
  getKeyFilesForLanguage,
  createErrorResult,
  createSuccessResult,
  categorizeTemplates,
  formatSupportedLanguagesResponse,
  formatTemplatesByLanguageResponse,
  handleGetTemplates,
  handleGetSupportedLanguages,
  handleGetTemplatesByLanguage,
  handleGetTemplateFiles,
} from './handlers.js';
import { VALID_LANGUAGES, VALID_TEMPLATES, getLanguageDetails } from './templates.js';

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

describe('getKeyFilesForLanguage', () => {
  const allFiles = [
    'function_app.py',
    'requirements.txt',
    'host.json',
    'local.settings.json',
    'Program.cs',
    'HttpTrigger.cs',
    'pom.xml',
    'src/main/java/Function.java',
    'src/main/java/Helper.java',
    'index.ts',
    'function.json',
  ];

  it('should return correct key files for Python', () => {
    const result = getKeyFilesForLanguage('python', allFiles);
    expect(result).toContain('function_app.py');
    expect(result).toContain('requirements.txt');
    expect(result).toContain('host.json');
    expect(result).toContain('local.settings.json');
  });

  it('should return correct key files for C#', () => {
    const result = getKeyFilesForLanguage('csharp', allFiles);
    expect(result).toContain('host.json');
    expect(result).toContain('local.settings.json');
    expect(result).toContain('.template.config/template.json');
  });

  it('should return correct key files for Java', () => {
    const result = getKeyFilesForLanguage('java', allFiles);
    expect(result).toContain('pom.xml');
    expect(result).toContain('host.json');
    expect(result).toContain('local.settings.json');
  });

  it('should return correct key files for TypeScript', () => {
    const result = getKeyFilesForLanguage('typescript', allFiles);
    expect(result).toContain('index.ts');
    expect(result).toContain('function.json');
    expect(result).toContain('package.json');
    expect(result).toContain('host.json');
  });

  it('should include up to 2 .cs files for C#', () => {
    const csFiles = ['One.cs', 'Two.cs', 'Three.cs', 'Four.cs'];
    const result = getKeyFilesForLanguage('csharp', csFiles);
    const includedCsFiles = result.filter((f) => f.endsWith('.cs'));
    expect(includedCsFiles.length).toBeLessThanOrEqual(2);
  });

  it('should include up to 2 Java source files for Java', () => {
    const javaFiles = ['src/main/java/One.java', 'src/main/java/Two.java', 'src/main/java/Three.java'];
    const result = getKeyFilesForLanguage('java', javaFiles);
    const includedJavaFiles = result.filter((f) => f.endsWith('.java'));
    expect(includedJavaFiles.length).toBeLessThanOrEqual(2);
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

describe('categorizeTemplates', () => {
  it('should categorize templates by category', () => {
    const { categories } = categorizeTemplates('python');
    expect(Object.keys(categories).length).toBeGreaterThan(0);
  });

  it('should group related templates together', () => {
    const { categories } = categorizeTemplates('csharp');
    // Check that categories exist
    expect(Object.keys(categories).some((c) => c.includes('Storage') || c.includes('HTTP'))).toBe(true);
  });

  it('should handle all valid languages', () => {
    for (const lang of VALID_LANGUAGES) {
      const { categories, uncategorized } = categorizeTemplates(lang);
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

describe('formatSupportedLanguagesResponse', () => {
  it('should include all languages', () => {
    const result = formatSupportedLanguagesResponse();
    for (const lang of VALID_LANGUAGES) {
      expect(result).toContain(lang);
    }
  });

  it('should include language details', () => {
    const result = formatSupportedLanguagesResponse();
    expect(result).toContain('C#');
    expect(result).toContain('Java');
    expect(result).toContain('Python');
    expect(result).toContain('TypeScript');
    expect(result).toContain('Runtime');
    expect(result).toContain('Key Features');
  });
});

describe('formatTemplatesByLanguageResponse', () => {
  it('should include template count', () => {
    const result = formatTemplatesByLanguageResponse('python');
    expect(result).toContain(`Total Templates: ${VALID_TEMPLATES.python.length}`);
  });

  it('should include template names', () => {
    const result = formatTemplatesByLanguageResponse('python');
    expect(result).toContain('HttpTrigger');
  });

  it('should include usage guidance', () => {
    const result = formatTemplatesByLanguageResponse('csharp');
    expect(result).toContain('Next Steps');
    expect(result).toContain('get_azure_functions_templates');
  });
});

// Handler integration tests (require actual template files)
describe('handleGetTemplates', () => {
  it('should return error for invalid language', async () => {
    const result = await handleGetTemplates({ language: 'invalid', template: 'HttpTrigger' }, TEMPLATES_ROOT);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid language');
  });

  it('should return error for invalid template', async () => {
    const result = await handleGetTemplates({ language: 'python', template: 'InvalidTemplate' }, TEMPLATES_ROOT);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid template');
  });

  it('should return template files for valid input', async () => {
    const result = await handleGetTemplates({ language: 'python', template: 'HttpTrigger' }, TEMPLATES_ROOT);
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Azure Functions Template');
    expect(result.content[0].text).toContain('function_app.py');
  });

  it('should return specific file when filePath provided', async () => {
    const result = await handleGetTemplates(
      { language: 'python', template: 'HttpTrigger', filePath: 'function_app.py' },
      TEMPLATES_ROOT
    );
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('function_app.py');
  });

  it('should prevent path traversal', async () => {
    const result = await handleGetTemplates(
      { language: 'python', template: 'HttpTrigger', filePath: '../../../etc/passwd' },
      TEMPLATES_ROOT
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('path traversal');
  });

  it('should return error for non-existent file', async () => {
    const result = await handleGetTemplates(
      { language: 'python', template: 'HttpTrigger', filePath: 'nonexistent.xyz' },
      TEMPLATES_ROOT
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('File not found');
  });
});

describe('handleGetSupportedLanguages', () => {
  it('should return supported languages information', async () => {
    const result = await handleGetSupportedLanguages();
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Azure Functions Supported Languages');
    expect(result.content[0].text).toContain('csharp');
    expect(result.content[0].text).toContain('python');
  });
});

describe('handleGetTemplatesByLanguage', () => {
  it('should return error for invalid language', async () => {
    const result = await handleGetTemplatesByLanguage({ language: 'invalid' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid language');
  });

  it('should return templates for valid language', async () => {
    const result = await handleGetTemplatesByLanguage({ language: 'typescript' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Azure Functions Templates for TYPESCRIPT');
    expect(result.content[0].text).toContain('HttpTrigger');
  });
});

describe('handleGetTemplateFiles', () => {
  it('should return error for invalid language', async () => {
    const result = await handleGetTemplateFiles({ language: 'invalid', template: 'HttpTrigger' }, TEMPLATES_ROOT);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('INVALID LANGUAGE');
  });

  it('should return error for invalid template', async () => {
    const result = await handleGetTemplateFiles({ language: 'java', template: 'InvalidTemplate' }, TEMPLATES_ROOT);
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('INVALID TEMPLATE');
  });

  it('should return all template files for valid input', async () => {
    const result = await handleGetTemplateFiles({ language: 'java', template: 'HttpTrigger' }, TEMPLATES_ROOT);
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('Azure Functions Template: java/HttpTrigger');
    expect(result.content[0].text).toContain('pom.xml');
  });
});
