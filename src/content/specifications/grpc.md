---
title: gRPC & Protocol Buffers
description: A high-performance, open-source universal RPC framework using Protocol Buffers as its interface definition and serialization language.
currentVersion: Proto3
officialUrl: https://grpc.io/
---

gRPC is a modern open-source high-performance Remote Procedure Call (RPC) framework developed by Google in 2015. It can run in any environment, connecting services in and across data centers with pluggable support for load balancing, tracing, health checking, and authentication.

By default, gRPC uses **Protocol Buffers (Protobuf)** as its Interface Definition Language (IDL) and underlying message serialization format. It operates over **HTTP/2** as its transport protocol, offering significant latency improvements over traditional HTTP/1.1 JSON-based communication.

## Architecture & Transport Flow

Unlike REST, where communication centers around CRUD operations on resources over resource URLs, gRPC models communication as direct function invocations on remote servers. 

### The gRPC Request-Response Lifecycle

Communication between a gRPC client and server follows a low-latency, binary transmission pipeline:
1. **Client Stub Invocation**: The client application calls a local generated helper function, passing standard typed request objects.
2. **Binary Serialization**: The local Client Stub serializes the message parameters into a compact binary representation using the Protocol Buffers schema rules.
3. **HTTP/2 Transport**: The binary payload is streamed over an active, multiplexed HTTP/2 connection to the remote server.
4. **Server Routing**: The gRPC Server processes the multiplexed connection, decodes the routing metadata, and passes the binary stream to the appropriate service handler.
5. **Server Resolution**: The Service Handler deserializes the binary payload, runs the database or logic queries, and serializes the response back into binary, streaming it back to the client stub over the same connection.

---

## Protocol Buffers Schema Definition

In gRPC, the service interface and payload structures are defined inside a `.proto` text file. The gRPC compiler (`protoc`) uses this file to generate client stubs and server handlers in various languages.

### Schema Grammar (`service.proto`)

```protobuf
syntax = "proto3";

package api.catalog.v1;

option go_package = "catalog/v1;catalogv1";

// Service defining Procedure calls
service UserService {
  // Unary RPC (Request-Response)
  rpc GetUser (GetUserRequest) returns (GetUserResponse);
  
  // Server Streaming RPC (Single Request - Stream of Responses)
  rpc StreamPosts (StreamPostsRequest) returns (stream Post);
}

// Request payload definition
message GetUserRequest {
  string id = 1; // Field tag used for binary key matching
}

// Response payload definition
message GetUserResponse {
  string id = 1;
  string name = 2;
  string email = 3;
  UserStatus status = 4;
}

enum UserStatus {
  USER_STATUS_UNSPECIFIED = 0;
  USER_STATUS_ACTIVE = 1;
  USER_STATUS_SUSPENDED = 2;
}

message StreamPostsRequest {
  string user_id = 1;
}

message Post {
  string id = 1;
  string title = 2;
  string body = 3;
}
```

---

## gRPC Communication Patterns

gRPC natively supports four distinct streaming styles over HTTP/2 connections:

### 1. Unary RPC
A simple request-response pattern. The client sends a single request message and receives a single response message, mimicking a standard function call.

### 2. Server Streaming RPC
The client sends a single request message, and the server returns a stream of response messages. The client reads from the stream until there are no more messages (e.g. real-time feed updates).

### 3. Client Streaming RPC
The client writes a sequence of messages and sends them to the server, again using a stream. Once the client has finished writing the messages, it waits for the server to read them and return its response.

### 4. Bidirectional Streaming RPC
Both sides send a sequence of messages using an active read-write stream. The two streams operate independently, allowing clients and servers to read and write in any order.

---

## Comparison: REST (OpenAPI) vs. gRPC

| Feature | HTTP REST (OpenAPI) | gRPC (Protocol Buffers) |
| :--- | :--- | :--- |
| **Protocol** | HTTP/1.1 or HTTP/2. | Strict HTTP/2 (requires transport features). |
| **Payload Format** | Human-readable JSON or XML. | Binary serialized Protocol Buffers (non-human-readable). |
| **Contract** | Optional (OpenAPI schemas). | Mandatory interface definition (`.proto` file). |
| **Streaming** | Limited (SSE or WebSockets fallback). | Native bidirectional streaming support. |
| **Payload Size** | Larger (verbose text formatting). | Extremely small (packed binary compilation). |
| **Code Generation** | Optional (via OpenAPI generators). | Built-in via `protoc` compiler integration. |

---

## Best Practices in gRPC Design

1. **Maintain Backwards Compatibility**: Never change the field tag numbers (e.g., `string name = 2;`) of existing properties. Renaming fields is safe as long as type signatures and field tags remain intact.
2. **Utilize Standard Status Codes**: gRPC does not use HTTP status codes directly. It uses a specific set of **17 gRPC codes** (e.g. `OK`, `NOT_FOUND`, `ALREADY_EXISTS`, `UNAUTHENTICATED`) returned in HTTP/2 trailers.
3. **Use Keepalives for Long-Lived Streams**: Configure keepalive pings to detect half-closed TCP connections and keep load balancers from tearing down idle HTTP/2 multiplexed connections.
4. **Design for Idempotency**: Use `option idempotency_level = IDEMPOTENT;` metadata annotation inside the method definition to signal safe auto-retry behaviors to client libraries.
