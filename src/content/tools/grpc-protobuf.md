---
name: "gRPC / Protocol Buffers"
description: "A high-performance RPC framework and binary serialization protocol developed by Google."
category: "design-documentation"
lifecycleStages: ["design", "development"]
url: "https://grpc.io"
pricing: "open-source"
---

## What is gRPC / Protocol Buffers?

gRPC is an open source Remote Procedure Call (RPC) framework that operates in various environments. It facilitates efficient service connection within and across data centers. The framework is also suitable for connecting devices, mobile applications, and browsers to backend services, offering pluggable support for various functionalities.

## Why use it in the API Lifecycle?

* **Service Definition with Protocol Buffers**: Services are defined using Protocol Buffers, a binary serialization toolset and language for structured data.
* **Cross-Language and Cross-Platform Support**: The framework automatically generates idiomatic client and server stubs for services across multiple programming languages and platforms.
* **Scalability for RPCs**: gRPC supports scaling to millions of Remote Procedure Calls per second, with streamlined installation of runtime and development environments.
* **Bi-directional Streaming Communication**: It enables bi-directional streaming between client and server components.
* **Integrated Pluggable Authentication**: gRPC provides integrated and pluggable authentication capabilities, utilizing HTTP/2-based transport.
* **Pluggable Service Management**: It offers pluggable support for functionalities such as load balancing, tracing, and health checking.

## Best Practices

* Leverage gRPC-Web proxies to expose gRPC services directly to browser-based frontend clients.
