---
title: "Model Context Protocol (MCP)"
description: "A reference for the Model Context Protocol, covering its JSON-RPC 2.0 base, host, client and server roles, tools, resources and prompts, the stdio and Streamable HTTP transports, and OAuth-based authorization."
currentVersion: "2026-07-28"
officialUrl: "https://modelcontextprotocol.io/specification/latest"
---

## What is the Model Context Protocol?

The Model Context Protocol (MCP) is an open protocol for connecting LLM applications to external tools and data. An AI application that speaks MCP can use any MCP server without bespoke integration code, in the same way an editor that speaks the Language Server Protocol can use any language server. MCP was created by Anthropic and donated in December 2025 to the Agentic AI Foundation (AAIF), a directed fund under the Linux Foundation.

Versions are dated strings in `YYYY-MM-DD` form, marking the last backward-incompatible change. The current revision is `2026-07-28`, and it is a substantial break from the `2025-11-25` revision before it: the protocol is now stateless, with no `initialize` handshake and no protocol-level session. Check which revision a tutorial targets before copying from it.

---

## 1. Roles and Wire Format

MCP messages are [JSON-RPC 2.0](/specifications/json-rpc) requests, responses and notifications, UTF-8 encoded. Three roles take part:

| Role | What it is |
| --- | --- |
| **Host** | The LLM application the user runs (a chat app, an IDE, an agent runtime). It owns the model, the user's consent, and one or more clients. |
| **Client** | A connector inside the host that talks to exactly one server. |
| **Server** | A service exposing capabilities: tools, resources and prompts. |

In `2026-07-28`, every request carries its protocol version, client identity and client capabilities in `_meta`, so the server can accept or reject each request on its own. A client that wants to know what a server supports up front can call `server/discover`, but it is free to send any request directly and handle an `UnsupportedProtocolVersionError` if one comes back.

Messages flow one way per direction: clients send requests, servers send responses and notifications. When a server needs something from the client mid-call (user input, for example), it returns an `input_required` result and the client retries the original request with the answers attached. The specification calls this Multi Round-Trip Requests (MRTR), and it replaces the server-initiated requests of earlier revisions.

---

## 2. Server Primitives

A server offers any combination of three primitives:

| Primitive | Controlled by | Purpose | Key methods |
| --- | --- | --- | --- |
| **Tools** | The model | Functions the model can call, each with a name, a description and a JSON Schema `inputSchema` | `tools/list`, `tools/call` |
| **Resources** | The application | Context and data addressed by URI, for the user or the model to read | `resources/list`, `resources/read` |
| **Prompts** | The user | Templated messages and workflows the user picks | `prompts/list`, `prompts/get` |

Tools are the primitive most APIs end up exposing, and a tool definition is all the model ever sees of your operation. How much of an API contract survives that conversion is covered in [How an API Becomes Tool Definitions](/guides/tool-definitions).

On the client side, the remaining core feature is **elicitation**: a server asking the user, through the host, for additional information. **Roots**, **sampling** and **logging** were deprecated in `2026-07-28` and remain in the specification for at least twelve months. Do not build new servers on them: pass directories through tool parameters or configuration instead of roots, call an LLM provider directly instead of sampling, and use `stderr` or [OpenTelemetry](/specifications/opentelemetry) instead of MCP logging.

Long-running work, interactive UI and similar capabilities are now opt-in **extensions** negotiated between client and server (Tasks and MCP Apps are the notable ones), rather than core features.

---

## 3. Transports

The specification defines two standard transports. Protocol semantics are identical on both.

* **stdio**: the client launches the server as a subprocess and exchanges newline-delimited JSON-RPC over standard input and output. Use it for local servers.
* **Streamable HTTP**: the server exposes a single MCP endpoint, and every client message is its own [`POST`](/methods/post). The server answers each request with either `application/json` or a request-scoped [Server-Sent Events](/specifications/server-sent-events) stream carrying progress notifications followed by the final response.

Streamable HTTP mirrors body fields into headers so gateways can route without parsing JSON:

```http
POST /mcp HTTP/1.1
Host: mcp.example.com
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: get_weather
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "location": "Seattle, WA" },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": { "name": "ExampleClient", "version": "1.0.0" },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

The body is the source of truth. A server that finds a header disagreeing with the body must reject the request with [`400 Bad Request`](/status-codes/400) and the JSON-RPC error `-32020` (`HeaderMismatch`), which stops a load balancer routing on one value while the server executes another. Servers must also validate the [`Origin`](/headers/origin) header and return [`403 Forbidden`](/status-codes/403) for an invalid one, because a local server without that check can be driven from any web page through DNS rebinding.

The `2026-07-28` revision removed the standalone [`GET`](/methods/get) stream, the `Mcp-Session-Id` header and resumption via `Last-Event-ID`. A server that only speaks this revision answers `GET` or `DELETE` with [`405 Method Not Allowed`](/status-codes/405). The original HTTP+SSE transport from `2024-11-05` has been deprecated since `2025-03-26`; do not implement it for anything new.

---

## 4. Authorization

Authorization is optional, applies to HTTP transports only, and is built from existing OAuth specifications rather than anything MCP-specific. A stdio server should take credentials from its environment instead.

* The MCP server is an [OAuth 2.1](/specifications/oauth2) **resource server**. The specification references the OAuth 2.1 Internet-Draft, not a published RFC.
* The server **must** publish OAuth 2.0 Protected Resource Metadata (RFC 9728), and clients must use it to find the authorization server.
* Authorization servers must publish RFC 8414 metadata or OpenID Connect Discovery. Clients must support both.
* Clients use PKCE, which OAuth 2.1 requires, and must send the `resource` parameter (RFC 8707) naming the MCP server's canonical URI in both the authorization and token requests.
* Client registration prefers Client ID Metadata Documents, where the `client_id` is an HTTPS URL the authorization server fetches. Dynamic Client Registration (RFC 7591) still works but was deprecated in `2026-07-28`.

An unauthenticated request gets a [`401 Unauthorized`](/status-codes/401) with a [`WWW-Authenticate`](/headers/www-authenticate) challenge pointing at the metadata:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource",
                         scope="files:read"
```

The token rule that matters most: a server **must** accept only tokens issued for itself as the audience, and **must not** pass a client's token through to an upstream API. If your server calls another API, it obtains its own credentials for that API. Token passthrough turns your server into a confused deputy.

---

## 5. Design Guidance

* **Wrap the API you have, do not replace it.** An MCP server is a client of your HTTP API with a model-shaped interface on top. Keep the HTTP contract authoritative and generate or curate tools from it; see the guide to [MCP servers](/guides/mcp-servers).
* **Curate tools rather than mirroring every endpoint.** Each tool definition costs the model context and attention. A handful of well-described, task-shaped tools beats a one-to-one mapping of 200 operations.
* **Fix the underlying API first.** Clear errors, idempotent retries and precise schemas matter more to an agent than to a person; work through the [Agent-Ready API Checklist](/guides/agent-ready-checklist) before writing the server.
