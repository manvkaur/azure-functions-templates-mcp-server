# Template Coverage TODO

This document tracks template coverage across all supported languages, based on the
[official Azure Functions supported bindings](https://learn.microsoft.com/azure/azure-functions/functions-triggers-bindings#supported-bindings) and bindings available in GA [extension bundle](https://github.com/Azure/azure-functions-extension-bundles/blob/main/src/Microsoft.Azure.Functions.ExtensionBundle/extensions.json).
Templates are defined in `src/templates.ts` and use `COMMON_TEMPLATE_METADATA` for consistent descriptions.

Last updated: February 17, 2026

---

## Legend

| Symbol | Meaning |
| -------- | --------- |
| ✅ | Implemented and available |
| 🔲 | Not implemented (add placeholder or implement) |
| ➖ | Not applicable or supported by Azure Functions for this binding type |

---

## Triggers (What starts the function)

Based on [supported bindings table](https://learn.microsoft.com/azure/azure-functions/functions-triggers-bindings#supported-bindings).

| Trigger | C# | Java | Python | TypeScript | Priority | Notes |
| --------- | :--: | :----: | :------: | :----------: | :--------: | ------- |
| **HTTP** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Timer** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Blob Storage** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Queue Storage** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Event Hubs** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Cosmos DB** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **MCP Tool** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Service Bus Queue** | ✅ | ✅ | ✅ | 🔲 | **High** | Add TypeScript template |
| **Service Bus Topic** | ✅ | ✅ | ✅ | 🔲 | **High** | Add TypeScript template |
| **Event Grid** | ✅ | ✅ | 🔲 | 🔲 | **High** | Add Python and TypeScript templates |
| **Durable Functions** | ✅ | ✅ | 🔲 | 🔲 | **High** | Add Python and TypeScript templates |
| **Blob (EventGrid)** | ✅ | 🔲 | ✅ | ✅ | Medium | Preferred over polling-based blob trigger |
| **Azure SQL** | ✅ | 🔲 | 🔲 | 🔲 | Medium | C# only — add others |
| **MCP Resource** | ✅ | 🔲 | ✅ | ✅ | Medium | Add Java template |
| **MySQL** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only — add others |
| **RabbitMQ** | ✅ | 🔲 | 🔲 | 🔲 | Low | Requires runtime-driven triggers |
| **Generic** | ➖ | 🔲 | ✅ | ✅ | Low | For custom triggers |
| **IoT Hub** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Uses Event Hubs under the hood |
| **Kafka** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Requires runtime-driven triggers |
| **Redis** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented in any language |
| **SignalR** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented in any language |

---

## Input Bindings (Read data)

| Binding | C# | Java | Python | TypeScript | Priority | Notes |
| --------- | :--: | :----: | :------: | :----------: | :--------: | ------- |
| **Blob Storage** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Cosmos DB** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Azure SQL** | ✅ | 🔲 | 🔲 | 🔲 | Medium | C# only |
| **SignalR** | ✅ | 🔲 | 🔲 | 🔲 | Medium | C# has SignalRConnectionInfoHttpTrigger |
| **MySQL** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only |
| **Table Storage** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |
| **Redis** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |

---

## Output Bindings (Write data)

| Binding | C# | Java | Python | TypeScript | Priority | Notes |
| --------- | :--: | :----: | :------: | :----------: | :--------: | ------- |
| **Blob Storage** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **Cosmos DB** | ✅ | ✅ | ✅ | ✅ | - | Complete |
| **SignalR** | ✅ | 🔲 | 🔲 | 🔲 | Medium | C# only (SignalRConnectionInfoHttpTrigger) |
| **Queue Storage** | 🔲 | 🔲 | 🔲 | 🔲 | Medium | Not implemented |
| **Service Bus** | 🔲 | 🔲 | 🔲 | 🔲 | Medium | Not implemented |
| **Event Hubs** | 🔲 | 🔲 | 🔲 | 🔲 | Medium | Not implemented |
| **Event Grid** | 🔲 | 🔲 | 🔲 | 🔲 | Medium | Not implemented |
| **Azure SQL** | 🔲 | 🔲 | 🔲 | 🔲 | Medium | Not implemented |
| **MySQL** | ✅ | 🔲 | 🔲 | 🔲 | Low | C# only |
| **Table Storage** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |
| **Redis** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |
| **IoT Hub** | 🔲 | 🔲 | 🔲 | ➖ | Low | Uses Event Hubs under the hood |
| **Kafka** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |
| **RabbitMQ** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |
| **SendGrid** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |
| **Twilio** | 🔲 | 🔲 | 🔲 | 🔲 | Low | Not implemented |

---

## High Priority Action Items

### 1. TypeScript — Add Service Bus Templates

- [ ] `ServiceBusQueueTrigger` — Create in `templates/typescript/ServiceBusQueueTrigger/`
- [ ] `ServiceBusTopicTrigger` — Create in `templates/typescript/ServiceBusTopicTrigger/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

### 2. Python & TypeScript — Add Event Grid Templates

- [ ] `EventGridTrigger` for Python — Create in `templates/python/EventGridTrigger/`
- [ ] `EventGridTrigger` for TypeScript — Create in `templates/typescript/EventGridTrigger/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

### 3. Python & TypeScript — Add Durable Functions Templates

- [ ] Durable Functions for Python — Create in `templates/python/DurableFunctions/`
- [ ] Durable Functions for TypeScript — Create in `templates/typescript/DurableFunctions/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

---

## Medium Priority Action Items

### 4. Java — Add MCP Resource Template

- [ ] `MCPResourceTrigger` for Java — Create in `templates/java/MCPResourceTrigger/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

### 5. Java — Add EventGrid Blob Trigger Template

- [ ] `BlobTriggerWithEventGrid` for Java — Create in `templates/java/BlobTriggerWithEventGrid/`
- [ ] Update `TEMPLATE_DESCRIPTIONS` in `src/templates.ts`

### 6. Add Azure SQL Templates for Other Languages

- [ ] `SqlTrigger` for Java, Python, TypeScript
- [ ] `SqlInputBinding` for Java, Python, TypeScript
- [ ] `SqlOutputBinding` for all languages (not implemented in any)

### 7. Add Output Bindings for Common Services

- [ ] Queue Storage output binding (all languages)
- [ ] Service Bus output binding (all languages)
- [ ] Event Hubs output binding (all languages)
- [ ] Event Grid output binding (all languages)

### 8. Add SignalR Templates for Other Languages

- [ ] SignalR input binding for Java, Python, TypeScript
- [ ] SignalR output binding for Java, Python, TypeScript

---

## Low Priority / Future Enhancements

- MySQL trigger, input, and output for Java, Python, TypeScript
- RabbitMQ trigger for Java, Python, TypeScript
- IoT Hub trigger for all languages (uses Event Hubs protocol)
- Kafka triggers and output bindings for all languages
- Redis triggers, input, and output bindings for all languages
- SignalR trigger for all languages
- Table Storage input/output bindings for all languages
- SendGrid / Twilio output bindings for all languages

---

## Out of Scope

The following bindings have been deprioritised and are not planned:

- **Dapr** (Topic Trigger, Service Invocation Trigger, Publish Output) — self-hosted only, limited adoption

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

- [Azure Functions triggers and bindings overview](https://learn.microsoft.com/azure/azure-functions/functions-triggers-bindings)
- [Supported bindings table](https://learn.microsoft.com/azure/azure-functions/functions-triggers-bindings#supported-bindings)
- [Code examples for bindings](https://learn.microsoft.com/azure/azure-functions/functions-triggers-bindings#code-examples-for-bindings)
