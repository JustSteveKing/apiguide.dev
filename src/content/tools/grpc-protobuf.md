---
name: "gRPC / Protocol Buffers"
description: "A high-performance RPC framework and binary serialization protocol developed by Google."
category: "design-documentation"
lifecycleStages: ["design", "development"]
url: "https://grpc.io"
pricing: "open-source"
---

## What is gRPC?

gRPC is a language-agnostic, high-performance Remote Procedure Call (RPC) framework developed by Google. It uses HTTP/2 for transport and Protocol Buffers (Protobuf) as its interface description and message serialization language.

## Why use it in the API Lifecycle?

* **Binary Serialization**: Protocol Buffers serialize payloads into a compact binary format, making them significantly faster and smaller than text-based JSON.
* **Bi-directional Streaming**: Native support for client streaming, server streaming, and bi-directional streaming via HTTP/2.
* **Microservices Communication**: The gold standard for low-overhead, inter-service communication inside secure cloud environments.

## Best Practices

* Leverage gRPC-Web proxies to expose gRPC services directly to browser-based frontend clients.
