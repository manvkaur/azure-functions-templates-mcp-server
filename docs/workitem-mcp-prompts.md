# Work Item: Add MCP Prompt Resource for Server Discoverability

## Title

Add MCP Prompt Resource to Help AI Clients Discover When to Use This Server

## Description

**Problem**: AI clients don't automatically know when to invoke this MCP server's tools. Users must explicitly mention "Azure Functions" or the AI must guess from tool descriptions. This leads to the AI writing Azure Function code from scratch instead of using the templates.

**Solution**: Implement MCP prompt resources that provide guidance to AI clients about when and how to use this server. Prompts are part of the MCP specification and allow servers to expose reusable prompt templates that clients can retrieve and inject into conversations.

**Scope**:
- Add a `prompts/list` handler that exposes available prompts
- Add a `prompts/get` handler that returns prompt content
- Register one primary prompt: `azure-functions-development`

## Files to Change

| File | Changes |
|------|---------|
| `src/server-factory.ts` | Add prompt registration using `server.prompt()` or request handlers for `prompts/list` and `prompts/get` |
| `src/server-factory.test.ts` | Add tests for prompt listing and retrieval |
| `README.md` | Document the prompt feature and how clients can use it |

## Prompt Content (Draft)

```
Name: azure-functions-development
Description: Guidance for creating Azure Functions with triggers and bindings

Content:
When the user asks to create any of the following, use this MCP server's tools:
- Azure Functions or serverless functions
- HTTP APIs, webhooks, or REST endpoints on Azure
- Triggers: Timer, Blob, Queue, Cosmos DB, Event Hub, Service Bus
- Bindings: Input/output bindings for storage, databases, messaging

Workflow:
1. get_languages_list - Discover supported languages
2. get_project_template - Get project scaffolding files
3. get_azure_functions_templates_list - Browse available triggers and bindings
4. get_azure_functions_template - Get ready-to-use function code

ALWAYS fetch templates instead of writing Azure Function code from scratch.
```

## Client Compatibility

| Client | Support Level | Notes |
|--------|--------------|-------|
| **Claude Desktop** | ✅ Full | Prompts appear in UI, can be selected by users or referenced by Claude |
| **MCP Inspector** | ✅ Full | Can list and test prompts interactively |
| **VS Code Copilot** | ⚠️ Limited | Tools work well; prompts not automatically injected in agent mode (as of Jan 2026) |
| **Custom MCP clients** | ✅ Full | Can implement `prompts/list` and `prompts/get` per MCP spec |

**Primary benefit**: Claude Desktop users will see the prompt and can use it to guide conversations.

## Implementation Notes

**MCP SDK API**:
```typescript
// Using @modelcontextprotocol/sdk
server.prompt(
  'azure-functions-development',
  { description: 'Guidance for creating Azure Functions' },
  async () => ({
    messages: [{
      role: 'user',
      content: { type: 'text', text: '...' }
    }]
  })
);
```

**Alternatively** (lower-level):
```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [{ name: 'azure-functions-development', description: '...' }]
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => ({
  messages: [{ role: 'user', content: { type: 'text', text: '...' } }]
}));
```

## Considerations

1. **Single vs Multiple Prompts**
   - Single `azure-functions-development` prompt is simpler and sufficient
   - Multiple specialized prompts (e.g., `create-http-api`, `add-database-trigger`) adds complexity without clear benefit

2. **Include Examples in Prompt?**
   - Pro: Helps AI understand exact tool call syntax
   - Con: Adds token overhead (~200-300 tokens)
   - Recommendation: Keep prompt concise; tool schemas already have examples

3. **Prompt Arguments**
   - MCP prompts can accept arguments (e.g., `language` parameter)
   - Not needed for this use case; keep it simple

4. **Future: VS Code Support**
   - Monitor VS Code Copilot updates for better prompt integration
   - Current keyword-rich tool descriptions remain the primary discoverability mechanism for VS Code

## Acceptance Criteria

- [ ] `prompts/list` returns the `azure-functions-development` prompt with name and description
- [ ] `prompts/get` returns the full prompt content
- [ ] MCP Inspector shows the prompt and can retrieve it
- [ ] Tests verify prompt registration and content
- [ ] README documents the prompt feature

## Priority

**Low-Medium** - Tool descriptions already provide discoverability for VS Code. This primarily benefits Claude Desktop users.

## Labels/Tags

`enhancement`, `mcp-protocol`, `discoverability`, `claude-desktop`
