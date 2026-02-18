# Template Coverage TODO

This document tracks template coverage across all supported languages.
Templates are defined in `src/templates.ts` and use `COMMON_TEMPLATE_METADATA` for consistent descriptions.

Last updated: February 12, 2026

---

## Legend

| Symbol | Meaning |
| -------- | --------- |
| ✅ | Implemented and available |
| 🔲 | Not implemented (add placeholder or implement) |
| ⚠️ | Partially implemented or needs review |

---

## Triggers (What starts the function)

| Trigger | C# | Java | Python | TypeScript | Priority | Notes |
| --------- | :--: | :----: | :------: | :----------: | :--------: | ------- |
| **HTTP** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Timer** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Blob Storage** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Blob (EventGrid)** | ✅ | 🔲 | ✅ | ✅ | Medium | Preferred over polling-based blob trigger |
| **Queue Storage** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Service Bus Queue** | ✅ | ✅ | ✅ | 🔲 | **High** | Add TypeScript template |
| **Service Bus Topic** | ✅ | ✅ | ✅ | 🔲 | **High** | Add TypeScript template |
| **Event Hub** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Event Grid** | ✅ | ✅ | 🔲 | 🔲 | **High** | Add Python and TypeScript templates |
| **Cosmos DB** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **SQL** | ✅ | 🔲 | 🔲 | 🔲 | Medium | C# only - add others |
| **MySQL** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only - add others |
| **Kafka** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented in any language |
| **Durable Functions** | ✅ | ✅ | 🔲 | 🔲 | **High** | Add Python and TypeScript templates |
| **MCP Tool** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **MCP Resource** | ✅ | 🔲 | ✅ | ✅ | Medium | Add Java template |
| **RabbitMQ** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only - add others |
| **Dapr Topic** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only - add others |
| **Dapr Service** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only - add others |
| **Generic** | 🔲 | 🔲 | ✅ | ✅ | - | For custom triggers |

---

## Input Bindings (Read data)

| Binding | C# | Java | Python | TypeScript | Priority | Notes |
| --------- | :--: | :----: | :------: | :----------: | :--------: | ------- |
| **Blob** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Cosmos DB** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **SQL** | ✅ | 🔲 | 🔲 | 🔲 | Medium | C# only |
| **MySQL** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only |
| **Table Storage** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |

---

## Output Bindings (Write data)

| Binding | C# | Java | Python | TypeScript | Priority | Notes |
| --------- | :--: | :----: | :------: | :----------: | :--------: | ------- |
| **Blob** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Queue Storage** | 🔲 | 🔲 | 🔲 | 🔲 | Medium | Not implemented |
| **Service Bus** | 🔲 | 🔲 | 🔲 | 🔲 | Medium | Not implemented |
| **Event Hub** | 🔲 | 🔲 | 🔲 | 🔲 | Medium | Not implemented |
| **Cosmos DB** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **SQL** | 🔲 | 🔲 | 🔲 | 🔲 | Medium | Not implemented |
| **MySQL** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only |
| **Table Storage** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |
| **SignalR** | ✅ | 🔲 | 🔲 | 🔲 | Medium | C# only |
| **SendGrid** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |
| **Twilio** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |
| **Dapr Publish** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only |

---

## High Priority Action Items

### 1. TypeScript - Add Service Bus Templates

- [ ] `ServiceBusQueueTrigger` - Create template files in `templates/typescript/ServiceBusQueueTrigger/`
- [ ] `ServiceBusTopicTrigger` - Create template files in `templates/typescript/ServiceBusTopicTrigger/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

### 2. TypeScript & Python - Add Event Grid Templates  

- [ ] `EventGridTrigger` for Python - Create in `templates/python/EventGridTrigger/`
- [ ] `EventGridTrigger` for TypeScript - Create in `templates/typescript/EventGridTrigger/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

### 3. TypeScript & Python - Add Durable Functions Templates

- [ ] Durable Functions for Python - Create in `templates/python/DurableFunctions/`
- [ ] Durable Functions for TypeScript - Create in `templates/typescript/DurableFunctions/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

---

## Medium Priority Action Items

### 4. Java - Add MCP Resource Template

- [ ] `MCPResourceTrigger` for Java - Create in `templates/java/MCPResourceTrigger/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

### 5. Java - Add EventGrid Blob Trigger Template

- [ ] `BlobTriggerWithEventGrid` for Java - Create in `templates/java/BlobTriggerWithEventGrid/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

### 6. Add SQL Triggers for Other Languages

- [ ] `SqlTrigger` for Java
- [ ] `SqlTrigger` for Python
- [ ] `SqlTrigger` for TypeScript
- [ ] `SqlInputBinding` for Java, Python, TypeScript

---

## Low Priority / Future Enhancements

- Kafka templates for all languages
- Table Storage input/output bindings
- Queue Storage output binding
- Service Bus output binding
- Event Hub output binding
- SendGrid/Twilio output bindings
- RabbitMQ for Java, Python, TypeScript
- Dapr templates for Java, Python, TypeScript

---

## Architecture Notes

### Description Consolidation

Template metadata is now consolidated in `COMMON_TEMPLATE_METADATA` to:

1. Ensure consistent descriptions across all languages
2. Reduce duplication and maintenance burden
3. Keep use cases language-agnostic (only code changes between runtimes)

### Adding New Templates

1. Create template files in `templates/{language}/{TemplateName}/`
2. Add entry to `TEMPLATE_DESCRIPTIONS` using `common('key-name')` helper
3. If new binding type, first add to `COMMON_TEMPLATE_METADATA`
4. Run tests: `npm test`
5. Update this checklist

---

## References

- [Azure Functions triggers and bindings](https://learn.microsoft.com/azure/azure-functions/functions-triggers-bindings)
- [Supported bindings](https://learn.microsoft.com/azure/azure-functions/functions-triggers-bindings#supported-bindings)
