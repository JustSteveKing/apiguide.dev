---
title: "Choosing an API Style: REST, GraphQL, gRPC, Events, JSON-RPC"
description: "When resource-oriented HTTP, GraphQL, gRPC, event-driven delivery or JSON-RPC is the right call, what each one costs you, and why most real systems use more than one."
category: "design"
---

## The Style Follows the Consumer

The argument over API styles is usually conducted as if one of them were better. None is. Each one optimizes for a particular kind of consumer and a particular kind of interaction, and each one charges for that in a currency you may or may not have.

The question that decides it is not "which is fastest" or "which is modern". It is: who calls this, what do they already have, and what shape is the interaction? A public API called by strangers with `curl`, a mobile app owned by the same team, a mesh of internal services and an AI agent talking over stdio have different answers, and a system that serves all four will reasonably use more than one style.

Start from resource-oriented HTTP and move away from it only when a specific condition below applies.

---

## 1. The Comparison

| Style | Contract | Transport | Wins when | Costs you |
| :--- | :--- | :--- | :--- | :--- |
| REST (resource-oriented HTTP) | [OpenAPI](/specifications/openapi) | HTTP, any version | Consumers are third parties; reads are cacheable; you want every HTTP tool to work | Chatty for screens that aggregate many resources |
| [GraphQL](/specifications/graphql) | Schema (SDL) | Usually HTTP `POST` to one endpoint | You own the clients and they compose many resources per screen | HTTP caching, status codes, query cost control, per-field authorization |
| [gRPC](/specifications/grpc) | [Protocol Buffers](/specifications/protocol-buffers) | HTTP/2 | Internal service-to-service calls, streaming, polyglot codegen | Browsers need gRPC-Web and a proxy; opaque to generic HTTP tooling |
| Event-driven (webhooks, brokers) | [AsyncAPI](/specifications/asyncapi), [Standard Webhooks](/specifications/standard-webhooks) | HTTP callbacks or a message broker | The consumer needs to know something happened, without polling | Delivery, ordering, retries and verification become your problem |
| [JSON-RPC](/specifications/json-rpc) | None built in | Transport-agnostic (HTTP, stdio, sockets) | The domain is actions rather than resources, or HTTP is not the transport | No caching, no standard error semantics beyond the envelope |

---

## 2. REST: The Default

Resource-oriented HTTP, as described in [REST principles](/guides/rest-principles), is the right default for anything consumed outside your team. Its advantage is not elegance. It is that every proxy, CDN, browser, gateway, log parser and HTTP client already understands it.

That buys you things the other styles have to rebuild:

- **Caching for free.** A [`GET`](/methods/get) with an [`ETag`](/headers/etag) and [`Cache-Control`](/headers/cache-control) is cacheable by infrastructure you do not run.
- **Failure semantics everyone shares.** A [`429 Too Many Requests`](/status-codes/429) with [`Retry-After`](/headers/retry-after) means the same thing to every client library.
- **The lowest barrier to a first call.** A stranger can explore it with a browser and `curl` before reading your documentation.

The usual complaint, over-fetching, is solvable without leaving REST: [sparse fieldsets](/guides/sparse-fieldsets) and expansion parameters cover most of it. Choose REST unless one of the conditions below is genuinely true.

---

## 3. GraphQL: When You Own the Clients

GraphQL wins when the same team builds the API and the clients, and those clients assemble screens out of many related resources. One query replaces a waterfall of requests, and the schema gives frontend engineers a typed, introspectable contract.

What you give up is most of what HTTP provides:

- **Caching.** Queries are typically sent as `POST` to a single endpoint, so shared caches cannot help. The [GraphQL over HTTP](https://http-spec.graphql.org/draft/) working draft permits `GET` for queries (and forbids it for mutations), and persisted queries make that practical, but it is work you have to do.
- **Status codes.** A GraphQL response can carry partial data and an `errors` array together, so the HTTP status no longer tells a client, a gateway or your monitoring whether the request succeeded.
- **Cost control.** A client can write a query that fans out across the whole graph. You need depth limits, complexity scoring or an allowlist of persisted queries, and rate limiting by request count stops meaning anything.
- **Authorization.** It has to be enforced per field and per object in resolvers, not per route at the edge.

Do not choose GraphQL for a public API whose main problem is over-fetching. Do choose it for a first-party product API where round trips are the bottleneck and you control every query that will ever be sent.

---

## 4. gRPC: Inside the Boundary

gRPC wins between services you operate. Protocol Buffers give you a compact binary encoding, a strict schema and generated clients in every major language, and HTTP/2 gives you multiplexing and four call shapes: unary, server streaming, client streaming and bidirectional streaming.

It loses at the edge. Browsers cannot speak native gRPC; [gRPC-Web](https://github.com/grpc/grpc-web) needs a proxy such as [Envoy](/tools/gateways-management/envoy) in front of the service, and it supports unary and server streaming only. Generic HTTP tooling sees opaque binary frames. Third-party developers expect to make a request with whatever client they already have.

Use gRPC for internal calls where both ends are yours and latency or streaming matters. If the same capability must also be public, expose a REST facade at the edge rather than asking outsiders to adopt your toolchain.

---

## 5. Events: Complement, Not Replacement

When a consumer needs to know that something happened, polling a REST endpoint is the wrong tool and so is a faster request-response protocol. Push the event: [webhooks](/guides/webhooks) for third parties over the public internet, a broker for internal consumers, or [streaming](/guides/streaming-apis) when the client holds a connection open.

Event-driven delivery does not replace a request-response API. It sits beside one. Treat each event as a notification and keep the resource fetchable over REST, so a consumer that missed an event, or received one out of order, can read the current state rather than reconstructing it from history.

Describe the channels and payloads in AsyncAPI, the same way OpenAPI describes the request side. Webhooks bring their own obligations: [signatures](/guides/webhook-signatures), retries with backoff, idempotent consumers and a [delivery history](/guides/webhook-delivery-history) your users can inspect.

---

## 6. JSON-RPC: Actions and Non-HTTP Transports

JSON-RPC 2.0 is a small envelope: a `method`, `params`, an `id` to match the reply, notifications that expect no reply, and a handful of reserved error codes. It says nothing about transport, which is its strength. It runs equally well over HTTP, a WebSocket or a process's stdin and stdout. The [Model Context Protocol](/specifications/model-context-protocol) is built on it for exactly that reason.

Choose it when the interface is a set of actions with no natural resource model, and especially when HTTP is not the transport. Do not choose it for a public web API: tunneling every call through one `POST` endpoint discards caching, method semantics and status codes, and you end up rebuilding them inside the envelope.

---

## 7. Mixing Styles

The common shape for a mature product is not one style. It is REST at the public edge, webhooks for change notification, gRPC between internal services and perhaps GraphQL behind a first-party frontend. That is not indecision; each boundary has a different consumer.

Two rules keep a mixed system coherent:

- **One domain model, several projections.** The order that appears in a REST response, a webhook payload and a protobuf message should have the same [identifiers](/guides/identifiers), the same field names where the formats allow, and the same enum values.
- **Do not expose the internal style externally by accident.** Once a third party integrates against your gRPC service or your GraphQL schema, it is a public contract with all the [breaking-change](/guides/breaking-changes) obligations that implies.
