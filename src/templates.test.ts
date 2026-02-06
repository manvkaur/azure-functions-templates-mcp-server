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
  getLanguageDetails,
  validateTemplatesExist,
  discoverTemplates,
  TemplateMetadataSchema,
  LanguageTemplatesSchema,
  AllTemplateDescriptionsSchema,
  validateTemplateDescriptions,
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

  it('should have 28 templates for csharp', () => {
    expect(VALID_TEMPLATES.csharp).toHaveLength(28);
  });

  it('should have 15 templates for java', () => {
    expect(VALID_TEMPLATES.java).toHaveLength(15);
  });

  it('should have 13 templates for python', () => {
    expect(VALID_TEMPLATES.python).toHaveLength(13);
  });

  it('should have 12 templates for typescript', () => {
    expect(VALID_TEMPLATES.typescript).toHaveLength(12);
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
      for (const desc of Object.values(descriptions)) {
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
    const fileNames = files.map((f) => path.basename(f));
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

  // Note: Invalid language test removed - TypeScript now enforces ValidLanguage type at compile time
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
    expect(getTemplatesForLanguage('csharp')?.length).toBe(28);
    expect(getTemplatesForLanguage('java')?.length).toBe(15);
    expect(getTemplatesForLanguage('python')?.length).toBe(13);
    expect(getTemplatesForLanguage('typescript')?.length).toBe(12);
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

  // Note: Invalid language test removed - TypeScript now enforces ValidLanguage type at compile time

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
    expect(details.csharp.templateCount).toBe(28);
    expect(details.java.templateCount).toBe(15);
    expect(details.python.templateCount).toBe(13);
    expect(details.typescript.templateCount).toBe(12);
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

// ============================================================================
// validateTemplatesExist() Tests
// ============================================================================
describe('validateTemplatesExist()', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-validate-'));

    // Create a minimal valid template structure for testing
    await fs.mkdir(path.join(tempDir, 'python', 'HttpTrigger'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'python', 'TimerTrigger'), { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should report missing templates when directory is empty', async () => {
    const emptyDir = path.join(tempDir, 'empty');
    await fs.mkdir(emptyDir, { recursive: true });

    const result = await validateTemplatesExist(emptyDir);

    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.checked).toBe(
      VALID_TEMPLATES.csharp.length +
        VALID_TEMPLATES.java.length +
        VALID_TEMPLATES.python.length +
        VALID_TEMPLATES.typescript.length
    );
  });

  it('should report specific missing templates', async () => {
    const result = await validateTemplatesExist(tempDir);

    expect(result.valid).toBe(false);
    // Python HttpTrigger and TimerTrigger exist, so they should NOT be in missing
    const pythonMissing = result.missing.filter((m) => m.language === 'python');
    expect(pythonMissing.some((m) => m.template === 'HttpTrigger')).toBe(false);
    expect(pythonMissing.some((m) => m.template === 'TimerTrigger')).toBe(false);
    // But other Python templates should be missing
    expect(pythonMissing.some((m) => m.template === 'BlobTrigger')).toBe(true);
  });

  it('should return correct checked count', async () => {
    const result = await validateTemplatesExist(tempDir);

    const expectedTotal =
      VALID_TEMPLATES.csharp.length +
      VALID_TEMPLATES.java.length +
      VALID_TEMPLATES.python.length +
      VALID_TEMPLATES.typescript.length;

    expect(result.checked).toBe(expectedTotal);
  });

  it('should include language and template in missing items', async () => {
    const result = await validateTemplatesExist(tempDir);

    for (const missing of result.missing) {
      expect(missing.language).toBeDefined();
      expect(missing.template).toBeDefined();
      expect(typeof missing.language).toBe('string');
      expect(typeof missing.template).toBe('string');
    }
  });
});

// ============================================================================
// discoverTemplates Tests
// ============================================================================
describe('discoverTemplates', () => {
  let tempDir: string;

  beforeAll(async () => {
    // Create a temp directory with some mock templates
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'discover-templates-test-'));

    // Create python language folder with 2 templates
    await fs.mkdir(path.join(tempDir, 'python', 'HttpTrigger'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'python', 'TimerTrigger'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'python', 'NewUndocumentedTemplate'), { recursive: true });

    // Create typescript language folder with 1 template
    await fs.mkdir(path.join(tempDir, 'typescript', 'HttpTrigger'), { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should discover templates from filesystem', async () => {
    const result = await discoverTemplates(tempDir);

    expect(result.languages).toContain('python');
    expect(result.languages).toContain('typescript');
    expect(result.templates.python).toContain('HttpTrigger');
    expect(result.templates.python).toContain('TimerTrigger');
    expect(result.templates.typescript).toContain('HttpTrigger');
  });

  it('should count total templates correctly', async () => {
    const result = await discoverTemplates(tempDir);

    // 3 python + 1 typescript = 4 total
    expect(result.totalTemplates).toBe(4);
  });

  it('should sort discovered languages', async () => {
    const result = await discoverTemplates(tempDir);

    expect(result.languages).toEqual([...result.languages].sort());
  });

  it('should sort discovered templates within each language', async () => {
    const result = await discoverTemplates(tempDir);

    for (const lang of result.languages) {
      const templates = result.templates[lang];
      expect(templates).toEqual([...templates].sort());
    }
  });

  it('should identify templates missing from disk', async () => {
    const result = await discoverTemplates(tempDir);

    // Most templates should be missing since we only created a few
    expect(result.missingFromDisk.length).toBeGreaterThan(0);

    // Python BlobTrigger should be missing (we didn't create it)
    expect(result.missingFromDisk).toContainEqual({
      language: 'python',
      template: 'BlobTrigger',
    });

    // All csharp templates should be missing (we didn't create any)
    const csharpMissing = result.missingFromDisk.filter((m) => m.language === 'csharp');
    expect(csharpMissing.length).toBe(VALID_TEMPLATES.csharp.length);
  });

  it('should identify extra templates on disk not in VALID_TEMPLATES', async () => {
    const result = await discoverTemplates(tempDir);

    // NewUndocumentedTemplate should be in extraOnDisk
    expect(result.extraOnDisk).toContainEqual({
      language: 'python',
      template: 'NewUndocumentedTemplate',
    });
  });

  it('should handle non-existent directory gracefully', async () => {
    const result = await discoverTemplates('/non/existent/path');

    expect(result.templates).toEqual({});
    expect(result.languages).toEqual([]);
    expect(result.totalTemplates).toBe(0);
    // All VALID_TEMPLATES should be reported as missing
    const expectedMissingCount = VALID_LANGUAGES.reduce((sum, lang) => sum + VALID_TEMPLATES[lang].length, 0);
    expect(result.missingFromDisk.length).toBe(expectedMissingCount);
  });

  it('should ignore files in template directories (only folders)', async () => {
    // Create a file in the python directory (not a template folder)
    await fs.writeFile(path.join(tempDir, 'python', 'README.md'), 'test');

    const result = await discoverTemplates(tempDir);

    // README.md should not be treated as a template
    expect(result.templates.python).not.toContain('README.md');

    // Clean up
    await fs.unlink(path.join(tempDir, 'python', 'README.md'));
  });

  it('should return empty extraOnDisk when all discovered templates are in VALID_TEMPLATES', async () => {
    // Create a temp dir with only known templates
    const cleanTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'discover-clean-test-'));

    try {
      await fs.mkdir(path.join(cleanTempDir, 'python', 'HttpTrigger'), { recursive: true });

      const result = await discoverTemplates(cleanTempDir);

      // HttpTrigger is a known template, so no extras
      expect(result.extraOnDisk.filter((e) => e.template === 'HttpTrigger')).toEqual([]);
    } finally {
      await fs.rm(cleanTempDir, { recursive: true, force: true });
    }
  });

  it('should detect unknown language directories as extra', async () => {
    // Create a temp dir with an unknown language
    const unknownLangDir = await fs.mkdtemp(path.join(os.tmpdir(), 'discover-unknown-lang-'));

    try {
      await fs.mkdir(path.join(unknownLangDir, 'rust', 'HttpTrigger'), { recursive: true });

      const result = await discoverTemplates(unknownLangDir);

      expect(result.languages).toContain('rust');
      expect(result.extraOnDisk).toContainEqual({
        language: 'rust',
        template: 'HttpTrigger',
      });
    } finally {
      await fs.rm(unknownLangDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Zod Schema Validation Tests
// ============================================================================
describe('TemplateMetadataSchema', () => {
  it('should validate correct metadata', () => {
    const validMetadata = {
      description: 'A valid description for the template',
      category: 'Web APIs',
      useCase: 'REST APIs, webhooks, web services',
    };
    const result = TemplateMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('should reject description shorter than 10 characters', () => {
    const invalidMetadata = {
      description: 'Short',
      category: 'Web APIs',
      useCase: 'REST APIs, webhooks, web services',
    };
    const result = TemplateMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least 10 characters');
    }
  });

  it('should reject category shorter than 3 characters', () => {
    const invalidMetadata = {
      description: 'A valid description for the template',
      category: 'AB',
      useCase: 'REST APIs, webhooks, web services',
    };
    const result = TemplateMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should reject useCase shorter than 10 characters', () => {
    const invalidMetadata = {
      description: 'A valid description for the template',
      category: 'Web APIs',
      useCase: 'Short',
    };
    const result = TemplateMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
  });

  it('should reject missing fields', () => {
    const invalidMetadata = {
      description: 'A valid description for the template',
    };
    const result = TemplateMetadataSchema.safeParse(invalidMetadata);
    expect(result.success).toBe(false);
  });
});

describe('LanguageTemplatesSchema', () => {
  it('should validate a collection of templates', () => {
    const validTemplates = {
      HttpTrigger: {
        description: 'HTTP-triggered function for REST API endpoints',
        category: 'Web APIs',
        useCase: 'REST APIs, webhooks, web services, serverless backends',
      },
      TimerTrigger: {
        description: 'Scheduled function execution using CRON expressions',
        category: 'Scheduling',
        useCase: 'Scheduled tasks, batch processing, maintenance jobs',
      },
    };
    const result = LanguageTemplatesSchema.safeParse(validTemplates);
    expect(result.success).toBe(true);
  });

  it('should reject templates with invalid metadata', () => {
    const invalidTemplates = {
      HttpTrigger: {
        description: 'Short', // Too short
        category: 'Web APIs',
        useCase: 'REST APIs, webhooks',
      },
    };
    const result = LanguageTemplatesSchema.safeParse(invalidTemplates);
    expect(result.success).toBe(false);
  });
});

describe('AllTemplateDescriptionsSchema', () => {
  it('should validate the full TEMPLATE_DESCRIPTIONS structure', () => {
    const result = AllTemplateDescriptionsSchema.safeParse(TEMPLATE_DESCRIPTIONS);
    expect(result.success).toBe(true);
  });

  it('should reject structure missing a language', () => {
    const invalidStructure = {
      csharp: {},
      java: {},
      python: {},
      // missing typescript
    };
    const result = AllTemplateDescriptionsSchema.safeParse(invalidStructure);
    expect(result.success).toBe(false);
  });
});

describe('validateTemplateDescriptions()', () => {
  it('should return valid for current TEMPLATE_DESCRIPTIONS', () => {
    const result = validateTemplateDescriptions();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate all templates have meaningful descriptions', () => {
    const result = validateTemplateDescriptions();
    expect(result.valid).toBe(true);

    // Verify each template has all required fields
    for (const lang of VALID_LANGUAGES) {
      for (const template of Object.keys(TEMPLATE_DESCRIPTIONS[lang])) {
        const meta = TEMPLATE_DESCRIPTIONS[lang][template];
        expect(meta.description.length).toBeGreaterThanOrEqual(10);
        expect(meta.category.length).toBeGreaterThanOrEqual(3);
        expect(meta.useCase.length).toBeGreaterThanOrEqual(10);
      }
    }
  });
});
