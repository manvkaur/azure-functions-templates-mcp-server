# Contributing to Azure Functions Templates MCP Server

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/azure-functions-templates-mcp-server.git
cd azure-functions-templates-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Development Workflow

### Code Quality

This project uses ESLint and Prettier for code quality:

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Testing

We maintain high test coverage (>90%). All new features should include tests:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run smoke test
npm run smoke
```

### Project Structure

```text
src/
├── server.ts           # MCP server setup and tool registration
├── handlers.ts         # Extracted handler logic (testable)
├── handlers.test.ts    # Handler unit tests
├── templates.ts        # Template definitions and utilities
└── templates.test.ts   # Template unit tests

templates/
├── csharp/             # C# (.NET Isolated) templates
├── java/               # Java (Maven) templates
├── python/             # Python (v2 Model) templates
└── typescript/         # TypeScript (Node.js v4) templates
```

## Adding New Templates

### Template Naming Conventions

- Use PascalCase for template directory names
- Follow consistent naming across languages:
  - `HttpTrigger`, `BlobTrigger`, `TimerTrigger` (not `httpTrigger`, `blob-trigger`)
  - `CosmosDBTrigger`, `MCPToolTrigger` (acronyms in uppercase)
  - `BlobInputBinding`, `BlobOutputBinding` for bindings

### Steps to Add a Template

1. Create the template directory under `templates/<language>/<TemplateName>/`
2. Add all necessary files (source code, config, dependencies)
3. Update `VALID_TEMPLATES` in `src/templates.ts`
4. Add description to `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`
5. Run tests to verify: `npm test`
6. Run smoke test: `npm run smoke`

### Template Requirements

Each template should include:

- Main function file with proper bindings
- `host.json` with Azure Functions runtime configuration
- `local.settings.json` for local development
- Language-specific project files (package.json, pom.xml, requirements.txt, .csproj)

## Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Make** your changes
4. **Test** thoroughly: `npm test && npm run lint`
5. **Commit** with clear messages
6. **Push** to your fork
7. **Open** a Pull Request

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Coverage maintained or improved
- [ ] Documentation updated if needed
- [ ] Commit messages are clear

## Code Guidelines

### TypeScript

- Use strict mode (enabled in tsconfig.json)
- Prefer `const` over `let`, avoid `var`
- Use async/await for async operations
- Add JSDoc comments for public functions

### Error Handling

- Never use `console.log` (stdout is reserved for MCP protocol)
- Use `console.error` for logging (goes to stderr)
- Return `isError: true` for tool errors

### Security

- Always validate user input
- Use `isPathSafe()` for file path operations
- Never expose file system paths in error messages

## Reporting Issues

When reporting issues, please include:

- Node.js version (`node --version`)
- npm version (`npm --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
