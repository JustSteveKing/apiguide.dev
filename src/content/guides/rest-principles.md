---
title: "REST API Design Principles"
description: "The core constraints of REST: resources, statelessness, the uniform interface, correct verbs and status codes, and the Richardson Maturity Model."
category: "core"
---

## Introduction to REST

REST (Representational State Transfer) is an architectural style defined by Roy Fielding in 2000. It is not a protocol or a standard, but a set of constraints that, when applied to HTTP, produce APIs that are scalable, cacheable, and easy to evolve.

Most APIs that call themselves "RESTful" only follow a subset of these constraints. Understanding the full picture helps you make deliberate trade-offs rather than accidental ones.

---

## 1. Resources & Representations

The central abstraction in REST is the **resource**: any concept worth naming, such as a user, an order, or a collection of orders. Each resource is addressable by a stable URI.

A resource is not the same as its representation. The server stores an order; it sends the client a *representation* of that order, typically as JSON. The same resource can have multiple representations negotiated via [content negotiation](/guides/content-negotiation).

```http
GET /orders/42 HTTP/1.1
Accept: application/json
```

```json
{
  "id": 42,
  "status": "shipped",
  "total": "49.99",
  "currency": "USD"
}
```

---

## 2. Statelessness

Each request must contain everything the server needs to process it. The server does not store client session state between requests; authentication tokens, for example, are sent on every call.

Statelessness makes horizontal scaling trivial: any server instance can handle any request because no request depends on session data pinned to a particular machine. It also improves reliability, since there is no session to lose when a node fails.

Application state (such as which page a client is viewing) lives with the client. Resource state lives on the server.

---

## 3. The Uniform Interface

The uniform interface is what separates REST from arbitrary RPC over HTTP. It has four elements:

- **Identification of resources** via URIs.
- **Manipulation through representations** — clients change state by sending representations, not by calling remote procedures.
- **Self-descriptive messages** — each message carries enough metadata (headers, media types) to be understood on its own.
- **HATEOAS** — responses include links describing what the client can do next.

Consistency here is the whole point: once a client understands how to interact with one resource, it understands them all.

---

## 4. Correct Verb Usage

Use HTTP methods for their defined semantics rather than tunnelling everything through [`POST`](/methods/post).

| Method | Purpose | Safe | Idempotent |
| --- | --- | --- | --- |
| [`GET`](/methods/get) | Retrieve a representation | Yes | Yes |
| [`POST`](/methods/post) | Create a subordinate resource | No | No |
| [`PUT`](/methods/put) | Replace a resource | No | Yes |
| [`PATCH`](/methods/patch) | Partially update a resource | No | No |
| [`DELETE`](/methods/delete) | Remove a resource | No | Yes |

Safe methods must never change server state. Idempotent methods can be retried safely (see [idempotency](/guides/idempotency)).

---

## 5. Correct Status Codes

Return the most specific status code that describes the outcome. Do not return [`200 OK`](/status-codes/200) with an error embedded in the body.

- [`201 Created`](/status-codes/201) after a successful `POST`, with a `Location` header.
- [`204 No Content`](/status-codes/204) for a successful `DELETE` with no body.
- [`400 Bad Request`](/status-codes/400) for malformed input, [`422`](/status-codes/422) for semantic validation errors.
- [`404 Not Found`](/status-codes/404) for missing resources, [`409 Conflict`](/status-codes/409) for state conflicts.

See the [error handling guide](/guides/error-handling) for structured error bodies.

---

## 6. The Richardson Maturity Model

Leonard Richardson's model grades how thoroughly an API adopts REST constraints:

- **Level 0** — A single URI, single verb (usually `POST`). Plain RPC over HTTP (e.g. SOAP).
- **Level 1** — Multiple resources with distinct URIs, but still one verb.
- **Level 2** — Proper use of HTTP verbs and status codes. Most production "REST" APIs live here.
- **Level 3** — Hypermedia controls ([HATEOAS](/guides/hateoas)): responses tell clients what they can do next.

Level 2 is a pragmatic, widely-adopted target. Level 3 unlocks discoverability and looser coupling but demands more from both server and client, which is why full adoption remains rare.
