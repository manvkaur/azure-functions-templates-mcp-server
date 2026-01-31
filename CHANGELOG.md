# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-01-30

### Added

- New `get_project_template` tool for project scaffolding with host.json, local.settings.json, and language-specific config files
- `SUPPORTED_RUNTIMES` configuration with version info for Python, TypeScript, Java, and C#
- Runtime version helper `formatRuntimeVersions()` for human-readable version strings
- MCP prompt resource documentation (`docs/workitem-mcp-prompts.md`)

### Changed

- Updated Java templates with latest Maven plugin versions (azure-functions-maven-plugin 1.37.0, azure-functions-java-library 3.2.2)
- Updated TypeScript template package.json dependencies
- Enhanced handler responses with project structure and prerequisites
- Refactored tests for improved coverage

## [0.1.3] - 2026-01-30

### Changed

- Engine requirements corrected.

## [0.1.2] - 2026-01-26

### Added

- README.md documentation for all 63 templates with Host Storage Configuration guidance
- Zod schema validation for template metadata (`TemplateMetadataSchema`, `validateTemplateDescriptions()`)
- JSON structured logging for log aggregation tools
- Integration tests for template validation (25 tests)
- TypeScript `tsconfig.json` for TimerTrigger template

### Changed

- Logger output now uses JSON format exclusively (timestamp, level, message, context)
- Server factory module for improved testability
- Build-time template validation script
- Node.js version runtime checks
- VS Code workspace settings
- Debug logger with security event logging (enable with `MCP_DEBUG=1`)
- Template definitions now use single source of truth (VALID_TEMPLATES derived from TEMPLATE_DESCRIPTIONS)
- Dynamic template counts in tool descriptions
- Server entry point refactored to use factory pattern

### Fixed

- Python template linting (PEP 8 compliance)
- Removed unused imports in TypeScript templates
- Error handling in main() with proper exit codes
- Missing README.md in CosmosDBInputOutputBinding and MCPToolTrigger TypeScript templates

## [0.1.1] - 2025-11-11

### Initial Release

- 4 MCP tools: get_azure_functions_templates, get_template_files, get_supported_languages, get_template_description
- Support for 4 languages: C#, Java, Python, TypeScript
- 63 templates covering major Azure services and trigger types

### Templates

- **C#**: 27 templates including HTTP, Timer, Queue, Blob, Cosmos DB, Event Hub, Service Bus, Durable Functions, and more
- **Java**: 14 templates including HTTP, Timer, Queue, Blob, Cosmos DB, Event Hub, and Durable Functions
- **Python**: 11 templates including HTTP, Timer, Queue, Blob, Cosmos DB, and Event Hub
- **TypeScript**: 10 templates including HTTP, Timer, Queue, Blob, Cosmos DB, and Event Hub

[0.1.3]: https://github.com/manvkaur/azure-functions-templates-mcp-server/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/manvkaur/azure-functions-templates-mcp-server/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/manvkaur/azure-functions-templates-mcp-server/releases/tag/v0.1.1
