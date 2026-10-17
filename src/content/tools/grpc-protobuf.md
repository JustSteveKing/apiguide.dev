---
name: "gRPC & Protobuf Tooling"
description: "The compilers, code generators, linters and debugging tools around gRPC and Protocol Buffers: protoc and its plugins, Buf, grpcurl, server reflection and health checking."
category: "design-documentation"
lifecycleStages: ["design", "development"]
url: "https://grpc.io"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is gRPC & Protobuf Tooling?

gRPC & Protobuf Tooling is the open-source toolchain for building and operating services defined in `.proto` files. The protocols themselves are covered at [gRPC](/specifications/grpc) and [Protocol Buffers](/specifications/protocol-buffers); this page is about the tools. `protoc`, the Protocol Buffers compiler, parses `.proto` files and hands them to language plugins: for Go, `protoc-gen-go` generates the message types and `protoc-gen-go-grpc` generates the client and server code, and other languages have their own equivalents. The Buf CLI (Apache-2.0) replaces most day-to-day `protoc` use with `buf generate`, configured in `buf.gen.yaml`, and adds `buf lint`, `buf breaking`, `buf format` and `buf curl`. grpcurl (MIT) is "curl for gRPC": it takes a JSON request body, encodes it as Protobuf, and can find the schema through server reflection, `.proto` sources or a compiled protoset. On the server side, gRPC defines two standard services you register yourself: server reflection (`grpc/reflection/v1`), which publishes the server's schema to clients, and health checking (`grpc.health.v1.Health`), which reports whether the server or a named service is `SERVING` or `NOT_SERVING`.

## Why use it in the API Lifecycle?

* **Generated, typed clients**: `protoc` or `buf generate` turns the `.proto` contract into client stubs and server interfaces, so there is no hand-written client code to drift from the schema.
* **Breaking-change checks**: `buf breaking --against '.git#branch=main'` compares the schema in a pull request with the main branch and fails on changes that break compatibility.
* **Consistent schemas**: `buf lint` and `buf format` enforce naming and layout rules from `buf.yaml`, so every team's `.proto` files read the same way.
* **Debugging from the terminal**: `grpcurl localhost:8787 list` and `describe` explore a server through reflection, and `buf curl` calls gRPC, gRPC-Web and Connect endpoints using your schema. Postman also uses reflection.
* **Health checks that orchestrators understand**: the `Check` method serves load balancers and monitoring, `Watch` streams status changes to clients, and Kubernetes has supported gRPC liveness, readiness and startup probes against the health service as a stable feature since v1.27.

## Best Practices

* Commit `buf.yaml` and `buf.gen.yaml` and generate code in CI from them, rather than each developer running `protoc` with their own flags and plugin versions. Pin plugin versions: two machines generating from the same `.proto` with different plugins produce different code. See [SDK Generation](/guides/sdk-generation).
* Run `buf breaking` against the main branch on every pull request and make it a required check. Reusing a field number or changing a field's type compiles cleanly and corrupts data on the wire; the rules for evolving a schema safely are in [Protocol Buffers](/specifications/protocol-buffers) and [Breaking Changes](/guides/breaking-changes).
* Enable server reflection on internal and development servers, where grpcurl and Postman need it, and think before exposing it on a public API. The gRPC documentation notes that publishing reflection to public users can be considered a security issue. If you route by service, route the reflection service to the same backend as the services it describes, or clients will fail.
* Register the health service and actually update it. The library only provides the service: set each service to `NOT_SERVING` when its dependencies fail and on shutdown, so load balancers and Kubernetes probes stop sending traffic before requests start failing. The empty service name `""` reports the health of the whole server.
* Use `Watch` for clients that check health continuously. The gRPC documentation notes that polling `Check` from a fleet of clients does not scale.
* Keep a `.proto` source or protoset available for servers without reflection, so grpcurl can still be pointed at them with `-proto` or `-protoset` during an incident.
