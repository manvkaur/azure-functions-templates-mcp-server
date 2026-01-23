/**
 * Unit tests for templates.ts
 * Target: >80% code coverage
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  VALID_LANGUAGES,
  VALID_TEMPLATES,
  TEMPLATE_DESCRIPTIONS,
  FILE_EXTENSION_MAP,
  LANGUAGE_COMMON_FILES,
  exists,
  listFilesRecursive,
  getFileExtension,
  generateTemplateDescriptions,
  isValidLanguage,
  isValidTemplate,
  getTemplatesForLanguage,
  getTemplateDescription,
  isPathTraversal,
  getKeyFilesForLanguage,
  groupTemplatesByCategory,
  getLanguageDetails
} from './templates.js';

// ============================================================================
// VALID_LANGUAGES Tests
// ============================================================================
describe('VALID_LANGUAGES', () => {
  it('should contain exactly 4 languages', () => {
    expect(VALID_LANGUAGES).toHaveLength(4);
  });

  it('should include csharp, java, python, and typescript', () => {
    expect(VALID_LANGUAGES).toContain('csharp');
    expect(VALID_LANGUAGES).toContain('java');
    expect(VALID_LANGUAGES).toContain('python');
    expect(VALID_LANGUAGES).toContain('typescript');
  });

  it('should be a readonly array', () => {
    // TypeScript enforces this at compile time, but we can check it's an array
    expect(Array.isArray(VALID_LANGUAGES)).toBe(true);
  });
});

// ============================================================================
// VALID_TEMPLATES Tests
// ============================================================================
describe('VALID_TEMPLATES', () => {
  it('should have templates for all valid languages', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(VALID_TEMPLATES[lang]).toBeDefined();
      expect(Array.isArray(VALID_TEMPLATES[lang])).toBe(true);
      expect(VALID_TEMPLATES[lang].length).toBeGreaterThan(0);
    }
  });

  it('should have 29 templates for csharp', () => {
    expect(VALID_TEMPLATES.csharp).toHaveLength(29);
  });

  it('should have 14 templates for java', () => {
    expect(VALID_TEMPLATES.java).toHaveLength(14);
  });

  it('should have 11 templates for python', () => {
    expect(VALID_TEMPLATES.python).toHaveLength(11);
  });

  it('should have 10 templates for typescript', () => {
    expect(VALID_TEMPLATES.typescript).toHaveLength(10);
  });

  it('should include HttpTrigger for all languages', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(VALID_TEMPLATES[lang]).toContain('HttpTrigger');
    }
  });

  it('should include TimerTrigger for all languages', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(VALID_TEMPLATES[lang]).toContain('TimerTrigger');
    }
  });

  it('should include BlobTrigger for all languages', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(VALID_TEMPLATES[lang]).toContain('BlobTrigger');
    }
  });
});

// ============================================================================
// TEMPLATE_DESCRIPTIONS Tests
// ============================================================================
describe('TEMPLATE_DESCRIPTIONS', () => {
  it('should have descriptions for all valid languages', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(TEMPLATE_DESCRIPTIONS[lang]).toBeDefined();
    }
  });

  it('should have description, category, and useCase for each template', () => {
    for (const lang of VALID_LANGUAGES) {
      const descriptions = TEMPLATE_DESCRIPTIONS[lang];
      for (const [templateName, desc] of Object.entries(descriptions)) {
        expect(desc.description).toBeDefined();
        expect(desc.description.length).toBeGreaterThan(0);
        expect(desc.category).toBeDefined();
        expect(desc.category.length).toBeGreaterThan(0);
        expect(desc.useCase).toBeDefined();
        expect(desc.useCase.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have descriptions for HttpTrigger in all languages', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(TEMPLATE_DESCRIPTIONS[lang].HttpTrigger).toBeDefined();
      expect(TEMPLATE_DESCRIPTIONS[lang].HttpTrigger.category).toBe('Web APIs');
    }
  });
});

// ============================================================================
// FILE_EXTENSION_MAP Tests
// ============================================================================
describe('FILE_EXTENSION_MAP', () => {
  it('should map common file extensions correctly', () => {
    expect(FILE_EXTENSION_MAP['.cs']).toBe('csharp');
    expect(FILE_EXTENSION_MAP['.java']).toBe('java');
    expect(FILE_EXTENSION_MAP['.py']).toBe('python');
    expect(FILE_EXTENSION_MAP['.ts']).toBe('typescript');
    expect(FILE_EXTENSION_MAP['.js']).toBe('javascript');
    expect(FILE_EXTENSION_MAP['.json']).toBe('json');
    expect(FILE_EXTENSION_MAP['.xml']).toBe('xml');
    expect(FILE_EXTENSION_MAP['.md']).toBe('markdown');
    expect(FILE_EXTENSION_MAP['.txt']).toBe('text');
    expect(FILE_EXTENSION_MAP['.yml']).toBe('yaml');
    expect(FILE_EXTENSION_MAP['.yaml']).toBe('yaml');
  });
});

// ============================================================================
// LANGUAGE_COMMON_FILES Tests
// ============================================================================
describe('LANGUAGE_COMMON_FILES', () => {
  it('should have common files for all valid languages', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(LANGUAGE_COMMON_FILES[lang]).toBeDefined();
    }
  });

  it('should include .funcignore for all languages', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(LANGUAGE_COMMON_FILES[lang]['.funcignore']).toBeDefined();
      expect(LANGUAGE_COMMON_FILES[lang]['.funcignore'].length).toBeGreaterThan(0);
    }
  });

  it('should have appropriate content in .funcignore for each language', () => {
    expect(LANGUAGE_COMMON_FILES.csharp['.funcignore']).toContain('bin/');
    expect(LANGUAGE_COMMON_FILES.csharp['.funcignore']).toContain('obj/');
    expect(LANGUAGE_COMMON_FILES.java['.funcignore']).toContain('target/');
    expect(LANGUAGE_COMMON_FILES.python['.funcignore']).toContain('__pycache__/');
    expect(LANGUAGE_COMMON_FILES.typescript['.funcignore']).toContain('node_modules/');
  });
});

// ============================================================================
// exists() Tests
// ============================================================================
describe('exists()', () => {
  let tempDir: string;
  let tempFile: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-exists-'));
    tempFile = path.join(tempDir, 'test-file.txt');
    await fs.writeFile(tempFile, 'test content');
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return true for existing file', async () => {
    expect(await exists(tempFile)).toBe(true);
  });

  it('should return true for existing directory', async () => {
    expect(await exists(tempDir)).toBe(true);
  });

  it('should return false for non-existing path', async () => {
    expect(await exists(path.join(tempDir, 'non-existing-file.txt'))).toBe(false);
  });

  it('should return false for invalid path', async () => {
    expect(await exists('')).toBe(false);
  });
});

// ============================================================================
// listFilesRecursive() Tests
// ============================================================================
describe('listFilesRecursive()', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-list-'));
    
    // Create nested structure
    await fs.mkdir(path.join(tempDir, 'subdir1'));
    await fs.mkdir(path.join(tempDir, 'subdir2'));
    await fs.mkdir(path.join(tempDir, 'subdir1', 'nested'));
    
    await fs.writeFile(path.join(tempDir, 'root-file.txt'), 'root');
    await fs.writeFile(path.join(tempDir, 'subdir1', 'file1.txt'), 'sub1');
    await fs.writeFile(path.join(tempDir, 'subdir2', 'file2.txt'), 'sub2');
    await fs.writeFile(path.join(tempDir, 'subdir1', 'nested', 'deep-file.txt'), 'deep');
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should list all files recursively', async () => {
    const files = await listFilesRecursive(tempDir);
    expect(files).toHaveLength(4);
  });

  it('should include files from nested directories', async () => {
    const files = await listFilesRecursive(tempDir);
    const fileNames = files.map(f => path.basename(f));
    expect(fileNames).toContain('root-file.txt');
    expect(fileNames).toContain('file1.txt');
    expect(fileNames).toContain('file2.txt');
    expect(fileNames).toContain('deep-file.txt');
  });

  it('should return empty array for non-existing directory', async () => {
    const files = await listFilesRecursive(path.join(tempDir, 'non-existing'));
    expect(files).toHaveLength(0);
  });

  it('should return empty array for empty directory', async () => {
    const emptyDir = path.join(tempDir, 'empty');
    await fs.mkdir(emptyDir);
    const files = await listFilesRecursive(emptyDir);
    expect(files).toHaveLength(0);
  });
});

// ============================================================================
// getFileExtension() Tests
// ============================================================================
describe('getFileExtension()', () => {
  it('should return correct language for known extensions', () => {
    expect(getFileExtension('file.cs')).toBe('csharp');
    expect(getFileExtension('file.java')).toBe('java');
    expect(getFileExtension('file.py')).toBe('python');
    expect(getFileExtension('file.ts')).toBe('typescript');
    expect(getFileExtension('file.js')).toBe('javascript');
    expect(getFileExtension('file.json')).toBe('json');
  });

  it('should handle paths with directories', () => {
    expect(getFileExtension('src/main/java/Function.java')).toBe('java');
    expect(getFileExtension('path/to/file.py')).toBe('python');
  });

  it('should return text for unknown extensions', () => {
    expect(getFileExtension('file.unknown')).toBe('text');
    expect(getFileExtension('file.xyz')).toBe('text');
  });

  it('should return text for files without extension', () => {
    expect(getFileExtension('Dockerfile')).toBe('text');
    expect(getFileExtension('Makefile')).toBe('text');
  });

  it('should handle uppercase extensions', () => {
    expect(getFileExtension('file.CS')).toBe('csharp');
    expect(getFileExtension('file.JSON')).toBe('json');
  });
});

// ============================================================================
// generateTemplateDescriptions() Tests
// ============================================================================
describe('generateTemplateDescriptions()', () => {
  it('should generate descriptions for valid languages', () => {
    for (const lang of VALID_LANGUAGES) {
      const descriptions = generateTemplateDescriptions(lang);
      expect(descriptions).toBeDefined();
      expect(descriptions.length).toBeGreaterThan(0);
    }
  });

  it('should format each template as a bullet point', () => {
    const descriptions = generateTemplateDescriptions('python');
    expect(descriptions).toContain('- HttpTrigger:');
    expect(descriptions).toContain('- TimerTrigger:');
  });

  it('should include template descriptions', () => {
    const descriptions = generateTemplateDescriptions('csharp');
    expect(descriptions).toContain('HTTP-triggered function');
  });

  it('should return empty string for invalid language', () => {
    const descriptions = generateTemplateDescriptions('invalid');
    expect(descriptions).toBe('');
  });
});

// ============================================================================
// isValidLanguage() Tests
// ============================================================================
describe('isValidLanguage()', () => {
  it('should return true for valid languages', () => {
    expect(isValidLanguage('csharp')).toBe(true);
    expect(isValidLanguage('java')).toBe(true);
    expect(isValidLanguage('python')).toBe(true);
    expect(isValidLanguage('typescript')).toBe(true);
  });

  it('should return false for invalid languages', () => {
    expect(isValidLanguage('javascript')).toBe(false);
    expect(isValidLanguage('go')).toBe(false);
    expect(isValidLanguage('rust')).toBe(false);
    expect(isValidLanguage('')).toBe(false);
    expect(isValidLanguage('PYTHON')).toBe(false); // case-sensitive
  });
});

// ============================================================================
// isValidTemplate() Tests
// ============================================================================
describe('isValidTemplate()', () => {
  it('should return true for valid template and language combinations', () => {
    expect(isValidTemplate('python', 'HttpTrigger')).toBe(true);
    expect(isValidTemplate('csharp', 'BlobTrigger')).toBe(true);
    expect(isValidTemplate('java', 'TimerTrigger')).toBe(true);
    expect(isValidTemplate('typescript', 'QueueTrigger')).toBe(true);
  });

  it('should return false for invalid template names', () => {
    expect(isValidTemplate('python', 'NonExistentTrigger')).toBe(false);
    expect(isValidTemplate('csharp', 'InvalidTemplate')).toBe(false);
  });

  it('should return false for invalid language', () => {
    expect(isValidTemplate('invalid', 'HttpTrigger')).toBe(false);
  });

  it('should return false for template that exists in different language', () => {
    // DurableFunctionsOrchestration exists in csharp but not python
    expect(isValidTemplate('csharp', 'DurableFunctionsOrchestration')).toBe(true);
    expect(isValidTemplate('python', 'DurableFunctionsOrchestration')).toBe(false);
  });
});

// ============================================================================
// getTemplatesForLanguage() Tests
// ============================================================================
describe('getTemplatesForLanguage()', () => {
  it('should return templates for valid languages', () => {
    const pythonTemplates = getTemplatesForLanguage('python');
    expect(pythonTemplates).not.toBeNull();
    expect(pythonTemplates).toContain('HttpTrigger');
  });

  it('should return null for invalid language', () => {
    expect(getTemplatesForLanguage('invalid')).toBeNull();
    expect(getTemplatesForLanguage('')).toBeNull();
  });

  it('should return correct number of templates', () => {
    expect(getTemplatesForLanguage('csharp')?.length).toBe(29);
    expect(getTemplatesForLanguage('java')?.length).toBe(14);
    expect(getTemplatesForLanguage('python')?.length).toBe(11);
    expect(getTemplatesForLanguage('typescript')?.length).toBe(10);
  });
});

// ============================================================================
// getTemplateDescription() Tests
// ============================================================================
describe('getTemplateDescription()', () => {
  it('should return description for valid template', () => {
    const desc = getTemplateDescription('python', 'HttpTrigger');
    expect(desc).not.toBeNull();
    expect(desc?.description).toBeDefined();
    expect(desc?.category).toBe('Web APIs');
    expect(desc?.useCase).toBeDefined();
  });

  it('should return null for invalid language', () => {
    expect(getTemplateDescription('invalid', 'HttpTrigger')).toBeNull();
  });

  it('should return null for non-existent template', () => {
    expect(getTemplateDescription('python', 'NonExistentTemplate')).toBeNull();
  });
});

// ============================================================================
// isPathTraversal() Tests
// ============================================================================
describe('isPathTraversal()', () => {
  it('should return false for valid paths within base', () => {
    expect(isPathTraversal('/base/path', 'subdir/file.txt')).toBe(false);
    expect(isPathTraversal('/base/path', 'file.txt')).toBe(false);
    expect(isPathTraversal('/base/path', 'a/b/c/file.txt')).toBe(false);
  });

  it('should return true for path traversal attempts', () => {
    expect(isPathTraversal('/base/path', '../outside.txt')).toBe(true);
    expect(isPathTraversal('/base/path', '../../etc/passwd')).toBe(true);
    expect(isPathTraversal('/base/path', 'subdir/../../outside.txt')).toBe(true);
  });

  it('should handle absolute paths correctly', () => {
    // Absolute path that escapes base should be detected
    if (process.platform === 'win32') {
      expect(isPathTraversal('C:\\base\\path', 'D:\\other\\file.txt')).toBe(true);
    } else {
      expect(isPathTraversal('/base/path', '/etc/passwd')).toBe(true);
    }
  });
});

// ============================================================================
// getKeyFilesForLanguage() Tests
// ============================================================================
describe('getKeyFilesForLanguage()', () => {
  it('should return appropriate key files for python', () => {
    const keyFiles = getKeyFilesForLanguage('python', []);
    expect(keyFiles).toContain('function_app.py');
    expect(keyFiles).toContain('requirements.txt');
    expect(keyFiles).toContain('host.json');
    expect(keyFiles).toContain('local.settings.json');
  });

  it('should return appropriate key files for csharp', () => {
    const allFiles = ['Program.cs', 'Function.cs', 'Other.cs'];
    const keyFiles = getKeyFilesForLanguage('csharp', allFiles);
    expect(keyFiles).toContain('.template.config/template.json');
    expect(keyFiles).toContain('host.json');
    // Should include first 2 .cs files
    expect(keyFiles).toContain('Program.cs');
    expect(keyFiles).toContain('Function.cs');
    expect(keyFiles).not.toContain('Other.cs');
  });

  it('should return appropriate key files for java', () => {
    const allFiles = ['src/main/java/Function.java', 'src/main/java/Handler.java', 'src/main/java/Extra.java'];
    const keyFiles = getKeyFilesForLanguage('java', allFiles);
    expect(keyFiles).toContain('pom.xml');
    expect(keyFiles).toContain('host.json');
    // Should include first 2 Java files from src/main/java
    expect(keyFiles).toContain('src/main/java/Function.java');
    expect(keyFiles).toContain('src/main/java/Handler.java');
  });

  it('should return appropriate key files for typescript', () => {
    const keyFiles = getKeyFilesForLanguage('typescript', []);
    expect(keyFiles).toContain('index.ts');
    expect(keyFiles).toContain('package.json');
    expect(keyFiles).toContain('host.json');
  });

  it('should return default key files for unknown language', () => {
    const keyFiles = getKeyFilesForLanguage('unknown', []);
    expect(keyFiles).toContain('README.md');
    expect(keyFiles).toContain('package.json');
    expect(keyFiles).toContain('host.json');
  });
});

// ============================================================================
// groupTemplatesByCategory() Tests
// ============================================================================
describe('groupTemplatesByCategory()', () => {
  it('should group templates by category for valid languages', () => {
    const result = groupTemplatesByCategory('python');
    expect(result.categories).toBeDefined();
    expect(Object.keys(result.categories).length).toBeGreaterThan(0);
  });

  it('should include common categories', () => {
    const result = groupTemplatesByCategory('csharp');
    expect(result.categories['Web APIs']).toBeDefined();
    expect(result.categories['Web APIs']).toContain('HttpTrigger');
  });

  it('should return empty for invalid language', () => {
    const result = groupTemplatesByCategory('invalid');
    expect(Object.keys(result.categories)).toHaveLength(0);
    expect(result.uncategorized).toHaveLength(0);
  });

  it('should handle templates without descriptions', () => {
    // All current templates have descriptions, so uncategorized should be empty
    const result = groupTemplatesByCategory('python');
    expect(result.uncategorized).toHaveLength(0);
  });
});

// ============================================================================
// getLanguageDetails() Tests
// ============================================================================
describe('getLanguageDetails()', () => {
  it('should return details for all languages', () => {
    const details = getLanguageDetails();
    expect(details.csharp).toBeDefined();
    expect(details.java).toBeDefined();
    expect(details.python).toBeDefined();
    expect(details.typescript).toBeDefined();
  });

  it('should have correct structure for each language', () => {
    const details = getLanguageDetails();
    for (const lang of ['csharp', 'java', 'python', 'typescript'] as const) {
      const langDetails = details[lang];
      expect(langDetails.name).toBeDefined();
      expect(langDetails.runtime).toBeDefined();
      expect(langDetails.programmingModel).toBeDefined();
      expect(langDetails.templateCount).toBeGreaterThan(0);
      expect(Array.isArray(langDetails.keyFeatures)).toBe(true);
      expect(langDetails.keyFeatures.length).toBeGreaterThan(0);
      expect(Array.isArray(langDetails.filePatterns)).toBe(true);
    }
  });

  it('should have correct template counts', () => {
    const details = getLanguageDetails();
    expect(details.csharp.templateCount).toBe(29);
    expect(details.java.templateCount).toBe(14);
    expect(details.python.templateCount).toBe(11);
    expect(details.typescript.templateCount).toBe(10);
  });

  it('should have descriptive names', () => {
    const details = getLanguageDetails();
    expect(details.csharp.name).toBe('C#');
    expect(details.java.name).toBe('Java');
    expect(details.python.name).toBe('Python');
    expect(details.typescript.name).toBe('TypeScript');
  });
});

// ============================================================================
// Integration Tests - Data Consistency
// ============================================================================
describe('Data Consistency', () => {
  it('should have matching templates between VALID_TEMPLATES and TEMPLATE_DESCRIPTIONS', () => {
    for (const lang of VALID_LANGUAGES) {
      const templates = VALID_TEMPLATES[lang];
      const descriptions = TEMPLATE_DESCRIPTIONS[lang];
      
      for (const template of templates) {
        expect(descriptions[template]).toBeDefined();
      }
    }
  });

  it('should have no extra descriptions without corresponding templates', () => {
    for (const lang of VALID_LANGUAGES) {
      const templates = new Set(VALID_TEMPLATES[lang]);
      const descriptions = Object.keys(TEMPLATE_DESCRIPTIONS[lang]);
      
      for (const descTemplate of descriptions) {
        expect(templates.has(descTemplate)).toBe(true);
      }
    }
  });

  it('should have language details matching template counts', () => {
    const details = getLanguageDetails();
    for (const lang of VALID_LANGUAGES) {
      expect(details[lang].templateCount).toBe(VALID_TEMPLATES[lang].length);
    }
  });
});
