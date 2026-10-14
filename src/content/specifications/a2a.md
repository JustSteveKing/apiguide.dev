---
title: "Agent2Agent Protocol (A2A)"
description: "A reference for the Agent2Agent protocol, covering Agent Cards and discovery, tasks, messages and artifacts, the JSON-RPC, gRPC and HTTP+JSON bindings, streaming and push notifications, and how A2A differs from MCP."
currentVersion: "1.0"
officialUrl: "https://a2a-protocol.org/latest/specification/"
---

## What is A2A?

The Agent2Agent protocol (A2A) is an open protocol for one AI agent to discover another, hand it a task, and follow that task to completion. The agent on the other side is opaque: the caller does not see its tools, its prompts or its model, only the skills it advertises and the results it returns. A2A was created by Google, donated to the Linux Foundation in June 2025, and accepted as a project of the Agentic AI Foundation (AAIF) in August 2026. Version 1.0 is the first stable release.

A2A builds on existing standards rather than inventing transport: HTTP, [JSON-RPC](/specifications/json-rpc) 2.0, gRPC and [Server-Sent Events](/specifications/server-sent-events).

---

## 1. A2A and MCP

The two protocols are often mentioned together and solve different problems. The A2A specification itself calls them complementary.

| | [MCP](/specifications/model-context-protocol) | A2A |
| --- | --- | --- |
| Connects | An AI application to tools and data | An agent to another agent |
| The far side is | A capability: a function, a resource, a prompt | A peer: an autonomous agent with its own reasoning |
| Unit of work | A tool call, usually short-lived | A task with a lifecycle that can run for hours and pause for input |
| Visibility | The model sees every tool's schema | The caller sees advertised skills, not internals |

A typical deployment uses both: a client agent delegates a job to a remote agent over A2A, and that remote agent uses MCP to reach the tools and data it needs. Choose A2A when the thing you are calling decides *how* to do the work; choose MCP when you are exposing a specific operation and the caller decides when to invoke it. Wrapping a plain CRUD API as an "agent" just to speak A2A adds a task lifecycle that nothing needs.

---

## 2. The Agent Card

Discovery starts with an **Agent Card**, a JSON document describing the agent. The specification defines a well-known URI on the agent's domain for it:

```http
GET /.well-known/agent-card.json HTTP/1.1
Host: planner.example.com
```

```json
{
  "name": "Trip Planner Agent",
  "description": "Plans multi-day travel itineraries.",
  "version": "1.0.0",
  "supportedInterfaces": [
    {
      "url": "https://planner.example.com/a2a/v1",
      "protocolBinding": "HTTP+JSON",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": { "streaming": true, "pushNotifications": false },
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/plain", "application/json"],
  "skills": [
    {
      "id": "itinerary-planning",
      "name": "Itinerary planning",
      "description": "Builds a day-by-day plan from dates, budget and interests.",
      "tags": ["travel"]
    }
  ]
}
```

The required members are `name`, `description`, `supportedInterfaces`, `version`, `capabilities`, `defaultInputModes`, `defaultOutputModes` and `skills`. `securitySchemes` declares how to authenticate, modeled on the OpenAPI 3.2 Security Scheme Object: API key, HTTP auth, [OAuth 2.0](/specifications/oauth2), OpenID Connect and mutual TLS. A card can carry `signatures` so a consumer can verify it really belongs to the domain that serves it, and an agent can expose a richer **extended Agent Card** to authenticated callers.

Write skill descriptions for a model, not for a marketing page. A client agent decides whether to delegate based on that text alone.

---

## 3. Tasks, Messages and Artifacts

* **Message**: one turn of communication, with a `role` (`ROLE_USER` or `ROLE_AGENT`), a `messageId` and an array of `parts`.
* **Part**: a unit of content holding exactly one of `text`, `raw` bytes, a `url` or structured `data`, optionally with a `mediaType`.
* **Task**: the stateful unit of work, with an `id`, a `contextId` grouping related tasks, a `status`, a `history` and `artifacts`.
* **Artifact**: an output the agent produced, itself made of parts.

A task moves through these states:

| State | Kind |
| --- | --- |
| `TASK_STATE_SUBMITTED`, `TASK_STATE_WORKING` | Active |
| `TASK_STATE_INPUT_REQUIRED`, `TASK_STATE_AUTH_REQUIRED` | Interrupted: the agent is waiting on the caller |
| `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, `TASK_STATE_CANCELED`, `TASK_STATE_REJECTED` | Terminal |

An agent can answer a simple request with a direct message instead of creating a task. Clients must handle both.

---

## 4. Protocol Bindings

The operations (Send Message, Send Streaming Message, Get Task, List Tasks, Cancel Task, Subscribe to Task, plus push notification configuration) are defined abstractly and mapped onto three official bindings, named in the Agent Card's `protocolBinding`:

| Binding | Shape |
| --- | --- |
| `JSONRPC` | JSON-RPC 2.0 over HTTP, methods such as `SendMessage` and `GetTask` |
| `GRPC` | [Protocol Buffers](/specifications/protocol-buffers) service definitions |
| `HTTP+JSON` | Resource-style endpoints such as `POST /message:send` and `GET /tasks/{id}` |

```http
POST /a2a/v1/message:send HTTP/1.1
Host: planner.example.com
Content-Type: application/a2a+json
A2A-Version: 1.0
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

{
  "message": {
    "role": "ROLE_USER",
    "messageId": "0b6f2c1e-6a43-4c3e-9d0a-2f1d4c8e7a51",
    "parts": [{ "text": "Plan three days in Lisbon in May, mid-range budget." }]
  }
}
```

Clients send the version they speak in the `A2A-Version` header (major and minor only). A server that does not support it returns [`400 Bad Request`](/status-codes/400) with a problem details body listing the versions it does support.

---

## 5. Long-Running Work

A2A gives three ways to follow a task, and the right one depends on how long it runs:

* **Polling** with Get Task. Fine for short tasks and the simplest to make reliable.
* **Streaming** over Server-Sent Events, via Send Streaming Message or Subscribe to Task. The stream carries status and artifact updates and closes when the task reaches a terminal state. The agent must advertise `capabilities.streaming`.
* **Push notifications**: the client registers a webhook URL and the agent `POST`s updates to it. The agent sends the credentials named in the push configuration's `authentication` field in an [`Authorization`](/headers/authorization) header. Use this for tasks that outlive any reasonable connection, and treat the receiving endpoint like any other [webhook](/guides/webhooks): reject unauthenticated calls, and fetch the task with Get Task rather than trusting the payload alone.

Treat a remote agent's output with the same suspicion as any third-party API response. It came from a model you do not control.
