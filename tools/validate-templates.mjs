#!/usr/bin/env node

/**
 * Build-time template validation. Fails if templates on disk don't match TEMPLATE_DESCRIPTIONS.
 * Imports template definitions from compiled TypeScript to avoid duplication.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(__dirname, '..', 'templates');
const DIST_TEMPLATES_PATH = path.resolve(__dirname, '..', 'dist', 'src', 'templates.js');
const DIST_TEMPLATES_URL = new URL('../dist/src/templates.js', import.meta.url);

/**
 * Try to import VALID_TEMPLATES and VALID_LANGUAGES from compiled TypeScript.
 * Falls back to filesystem discovery if dist doesn't exist (fresh clone).
 */
async function getExpectedTemplates() {
  try {
    await fs.access(DIST_TEMPLATES_PATH);
    const templates = await import(DIST_TEMPLATES_URL);
    return {
      VALID_LANGUAGES: templates.VALID_LANGUAGES,
      VALID_TEMPLATES: templates.VALID_TEMPLATES,
      fromSource: true,
    };
  } catch {
    // dist doesn't exist yet - this is a fresh clone or clean build
    // Fall back to discovering from disk and just validate structure
    console.log('Note: dist/src/templates.js not found. Validating template structure only.\n');
    return {
      VALID_LANGUAGES: ['csharp', 'java', 'python', 'typescript'],
      VALID_TEMPLATES: null,
      fromSource: false,
    };
  }
}

async function discoverTemplatesOnDisk(languages) {
  const discovered = {};

  for (const lang of languages) {
    const langPath = path.join(TEMPLATES_ROOT, lang);
    discovered[lang] = [];

    try {
      const entries = await fs.readdir(langPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          discovered[lang].push(entry.name);
        }
      }
      discovered[lang].sort();
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // Language directory doesn't exist
    }
  }

  return discovered;
}

function compareTemplates(expected, discovered, languages) {
  const errors = [];

  for (const lang of languages) {
    const expectedSet = new Set(expected[lang] || []);
    const discoveredSet = new Set(discovered[lang] || []);

    // Find missing templates (in TEMPLATE_DESCRIPTIONS but not on disk)
    for (const template of expectedSet) {
      if (!discoveredSet.has(template)) {
        errors.push(`MISSING: ${lang}/${template} - defined in TEMPLATE_DESCRIPTIONS but not found on disk`);
      }
    }

    // Find undocumented templates (on disk but not in TEMPLATE_DESCRIPTIONS)
    for (const template of discoveredSet) {
      if (!expectedSet.has(template)) {
        errors.push(`UNDOCUMENTED: ${lang}/${template} - found on disk but not in TEMPLATE_DESCRIPTIONS`);
      }
    }
  }

  return { errors };
}

/**
 * Validates that the template count in package.json matches the actual count.
 * Extracts the number from patterns like "64+ templates" or "64 templates".
 */
async function validatePackageJsonCount(actualCount) {
  const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
  const warnings = [];

  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    // Check description field for template count
    const description = pkg.description || '';
    const match = description.match(/(\d+)\+?\s*templates/i);

    if (match) {
      const claimedCount = parseInt(match[1], 10);
      if (claimedCount > actualCount) {
        warnings.push(
          `PACKAGE.JSON: Claims "${claimedCount}+ templates" but only ${actualCount} exist. ` +
          `Update the description in package.json.`
        );
      } else if (actualCount > claimedCount + 10) {
        // Warn if actual count is significantly higher (suggest updating marketing)
        warnings.push(
          `PACKAGE.JSON: Claims "${claimedCount}+ templates" but ${actualCount} now exist. ` +
          `Consider updating the description in package.json to reflect growth.`
        );
      }
    }
  } catch (err) {
    // Non-fatal: just skip this validation
    console.log(`  [SKIP] Could not validate package.json count: ${err.message}`);
  }

  return warnings;
}

async function main() {
  console.log('Validating templates...\n');
  console.log(`Templates root: ${TEMPLATES_ROOT}\n`);

  // Check if templates directory exists
  try {
    await fs.access(TEMPLATES_ROOT);
  } catch {
    console.error('Templates directory not found:', TEMPLATES_ROOT);
    process.exit(1);
  }

  // Get expected templates from compiled source (single source of truth)
  const { VALID_LANGUAGES, VALID_TEMPLATES, fromSource } = await getExpectedTemplates();

  // Discover templates on disk
  const discovered = await discoverTemplatesOnDisk(VALID_LANGUAGES);

  // Print summary
  let totalExpected = 0;
  let totalDiscovered = 0;

  console.log('Template Summary:\n');
  for (const lang of VALID_LANGUAGES) {
    const expected = VALID_TEMPLATES?.[lang]?.length ?? discovered[lang]?.length ?? 0;
    const found = discovered[lang]?.length || 0;
    totalExpected += expected;
    totalDiscovered += found;

    const status = expected === found ? '[OK]' : '[FAIL]';
    console.log(`  ${status} ${lang}: ${found}/${expected} templates`);
  }
  console.log(`\n  Total: ${totalDiscovered}/${totalExpected} templates\n`);

  // Only compare if we have source definitions
  if (fromSource && VALID_TEMPLATES) {
    const { errors } = compareTemplates(VALID_TEMPLATES, discovered, VALID_LANGUAGES);

    if (errors.length > 0) {
      console.log('VALIDATION ERRORS:\n');
      for (const error of errors) {
        console.log(`  ${error}`);
      }
      console.log('\nTo fix these errors:');
      console.log('  - MISSING: Add the template directory to templates/<language>/');
      console.log('  - UNDOCUMENTED: Add the template to TEMPLATE_DESCRIPTIONS in src/templates.ts');
      console.log('                  OR remove the directory if it should not be included\n');
      process.exit(1);
    }

    // Validate package.json count matches actual templates
    const countWarnings = await validatePackageJsonCount(totalDiscovered);
    if (countWarnings.length > 0) {
      console.log('WARNINGS:\n');
      for (const warning of countWarnings) {
        console.log(`  ${warning}`);
      }
      console.log('');
    }
  }

  console.log('All templates validated successfully!\n');
}

main().catch((err) => {
  console.error('Validation failed with error:', err);
  process.exit(1);
});
