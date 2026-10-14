---
name: "gRPC / Protocol Buffers"
description: "A high-performance RPC framework and binary serialization protocol developed by Google."
category: "design-documentation"
lifecycleStages: ["design", "development"]
url: "https://grpc.io"
pricing: "open-source"
---

## What is gRPC / Protocol Buffers?

gRPC is an open-source Remote Procedure Call (RPC) framework. It connects services efficiently within and across data centers, supporting various functionalities like load balancing, tracing, health checking, and authentication. It is also suitable for connecting devices, mobile applications, and browsers to backend services.

## Why use it in the API Lifecycle?

* **Simple service definition**: Services are defined using Protocol Buffers, a binary serialization toolset and language.
* **Scalability**: The framework can scale to millions of RPCs per second.
* **Cross-language and platform compatibility**: It automatically generates client and server stubs in multiple languages and platforms.
* **Bi-directional streaming and integrated authentication**: It supports bi-directional streaming and includes pluggable authentication over HTTP/2-based transport.

## Best Practices

* Utilize Protocol Buffers for service definitions to leverage its serialization capabilities.
* Install runtime and development environments with single-line commands for quick setup.
* Leverage its generated client and server stubs for various languages to ensure cross-platform compatibility.
