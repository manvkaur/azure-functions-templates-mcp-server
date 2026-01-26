# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- README.md documentation for all 62 templates with Host Storage Configuration guidance
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

## [0.1.2] - 2026-01-23

### Initial Release

- 4 MCP tools: get_azure_functions_templates, get_template_files, get_supported_languages, get_template_description
- Support for 4 languages: C#, Java, Python, TypeScript
- 62 templates covering major Azure services and trigger types

### Templates

- **C#**: 27 templates including HTTP, Timer, Queue, Blob, Cosmos DB, Event Hub, Service Bus, Durable Functions, and more
- **Java**: 14 templates including HTTP, Timer, Queue, Blob, Cosmos DB, Event Hub, and Durable Functions
- **Python**: 11 templates including HTTP, Timer, Queue, Blob, Cosmos DB, and Event Hub
- **TypeScript**: 10 templates including HTTP, Timer, Queue, Blob, Cosmos DB, and Event Hub

[Unreleased]: https://github.com/manvkaur/azure-functions-templates-mcp-server/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/manvkaur/azure-functions-templates-mcp-server/releases/tag/v0.1.2
