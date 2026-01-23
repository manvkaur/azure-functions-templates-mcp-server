#!/usr/bin/env node

/**
 * Build-time validation script to ensure templates on disk match TEMPLATE_DESCRIPTIONS.
 * 
 * This script fails the build if:
 * - A template exists in TEMPLATE_DESCRIPTIONS but not on disk (missing)
 * - A template exists on disk but not in TEMPLATE_DESCRIPTIONS (undocumented)
 * 
 * Run: npm run validate:templates
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.resolve(__dirname, '..', 'templates');

// Define expected templates - must match TEMPLATE_DESCRIPTIONS in src/templates.ts
// This is the source of truth for what templates should exist
const EXPECTED_TEMPLATES = {
  csharp: [
    'BlobInputOutputBindings',
    'BlobTrigger',
    'CosmosDBInputBinding',
    'CosmosDBOutputBinding',
    'CosmosDBTrigger',
    'DaprPublishOutputBinding',
    'DaprServiceInvocationTrigger',
    'DaprTopicTrigger',
    'DurableFunctionsEntityClass',
    'DurableFunctionsEntityFunction',
    'DurableFunctionsOrchestration',
    'EventGridBlobTrigger',
    'EventGridTrigger',
    'EventHubTrigger',
    'HttpTrigger',
    'KustoInputBinding',
    'KustoOutputBinding',
    'MCPToolTrigger',
    'MySqlInputBinding',
    'MySqlOutputBinding',
    'MySqlTrigger',
    'QueueTrigger',
    'RabbitMQTrigger',
    'ServiceBusQueueTrigger',
    'ServiceBusTopicTrigger',
    'SignalRConnectionInfoHttpTrigger',
    'SqlInputBinding',
    'SqlTrigger',
    'TimerTrigger',
  ],
  java: [
    'BlobInputBinding',
    'BlobOutputBinding',
    'BlobTrigger',
    'CosmosDBInputBinding',
    'CosmosDBOutputBinding',
    'DurableFunctions',
    'EventGridTrigger',
    'EventHubTrigger',
    'HttpTrigger',
    'MCPToolTrigger',
    'QueueTrigger',
    'ServiceBusQueueTrigger',
    'ServiceBusTopicTrigger',
    'TimerTrigger',
  ],
  python: [
    'BlobInputBinding',
    'BlobOutputBinding',
    'BlobTrigger',
    'BlobTriggerWithEventGrid',
    'CosmosDBInputOutputBinding',
    'CosmosDBTrigger',
    'EventHubTrigger',
    'HttpTrigger',
    'MCPToolTrigger',
    'QueueTrigger',
    'TimerTrigger',
  ],
  typescript: [
    'BlobInputAndOutputBindings',
    'BlobTrigger',
    'BlobTriggerWithEventGrid',
    'CosmosDBInputOutputBinding',
    'CosmosDBTrigger',
    'EventHubTrigger',
    'HttpTrigger',
    'MCPToolTrigger',
    'QueueTrigger',
    'TimerTrigger',
  ],
};

const VALID_LANGUAGES = ['csharp', 'java', 'python', 'typescript'];

/**
 * Discover templates from filesystem
 */
async function discoverTemplatesOnDisk() {
  const discovered = {};
  
  for (const lang of VALID_LANGUAGES) {
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

/**
 * Compare expected vs discovered templates
 */
function compareTemplates(expected, discovered) {
  const errors = [];
  const warnings = [];
  
  for (const lang of VALID_LANGUAGES) {
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
  
  // Check for unexpected language directories
  return { errors, warnings };
}

/**
 * Main validation function
 */
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
  
  // Discover templates on disk
  const discovered = await discoverTemplatesOnDisk();
  
  // Compare with expected
  const { errors, warnings } = compareTemplates(EXPECTED_TEMPLATES, discovered);
  
  // Print summary
  let totalExpected = 0;
  let totalDiscovered = 0;
  
  console.log('Template Summary:\n');
  for (const lang of VALID_LANGUAGES) {
    const expected = EXPECTED_TEMPLATES[lang]?.length || 0;
    const found = discovered[lang]?.length || 0;
    totalExpected += expected;
    totalDiscovered += found;
    
    const status = expected === found ? '[OK]' : '[FAIL]';
    console.log(`  ${status} ${lang}: ${found}/${expected} templates`);
  }
  console.log(`\n  Total: ${totalDiscovered}/${totalExpected} templates\n`);
  
  // Print warnings
  if (warnings.length > 0) {
    console.log('WARNINGS:\n');
    for (const warning of warnings) {
      console.log(`  ${warning}`);
    }
    console.log('');
  }
  
  // Print errors and exit
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
  
  console.log('All templates validated successfully!\n');
}

main().catch((err) => {
  console.error('Validation failed with error:', err);
  process.exit(1);
});
