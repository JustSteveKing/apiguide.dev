---
name: "AsyncAPI Specification"
description: "An open-source specification format used to design, document, and manage event-driven APIs."
category: "design-documentation"
lifecycleStages: ["design"]
url: "https://asyncapi.com"
pricing: "open-source"
---

## What is AsyncAPI?

AsyncAPI is a specification format for event-driven architectures. Similar to how OpenAPI defines synchronous HTTP request-response interfaces, AsyncAPI defines asynchronous, message-based communication schemas.

## Why use it in the API Lifecycle?

* **Document Event-Driven Architecture**: Define message payloads, channels (topics), and protocols (Kafka, RabbitMQ, WebSockets, MQTT, AWS SQS) in a standard format.
* **Unified Interface**: Enable client applications to understand how to publish and subscribe to events without inspecting source code.
* **Tool Ecosystem**: Supports code generation, payload validation, and interactive documentation viewers similar to Swagger.

## Best Practices

* Use AsyncAPI alongside OpenAPI to document hybrid architectures that combine REST interfaces with asynchronous event notifications.
