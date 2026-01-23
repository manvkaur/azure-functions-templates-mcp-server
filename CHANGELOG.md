# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Server factory module for improved testability
- Build-time template validation script
- Node.js version runtime checks
- VS Code workspace settings
- Debug logger with security event logging (enable with `MCP_DEBUG=1`)
- CHANGELOG.md following Keep a Changelog format

### Changed

- Template definitions now use single source of truth (VALID_TEMPLATES derived from TEMPLATE_DESCRIPTIONS)
- Dynamic template counts in tool descriptions
- Server entry point refactored to use factory pattern

## [0.1.2] - 2026-01-23

### Added

- Initial public release
- 4 MCP tools: get_azure_functions_templates, get_template_files, get_supported_languages, get_template_description
- Support for 4 languages: C#, Java, Python, TypeScript
- 64+ templates covering major Azure services and trigger types

### Templates

- **C#**: 28 templates including HTTP, Timer, Queue, Blob, Cosmos DB, Event Hub, Service Bus, Durable Functions, and more
- **Java**: 14 templates including HTTP, Timer, Queue, Blob, Cosmos DB, Event Hub, and Durable Functions
- **Python**: 11 templates including HTTP, Timer, Queue, Blob, Cosmos DB, and Event Hub
- **TypeScript**: 11 templates including HTTP, Timer, Queue, Blob, Cosmos DB, and Event Hub

[Unreleased]: https://github.com/manvkaur/azure-functions-templates-mcp-server/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/manvkaur/azure-functions-templates-mcp-server/releases/tag/v0.1.2
