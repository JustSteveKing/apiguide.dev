---
title: "Exposing an HTTP API as an MCP Server"
description: "Building a Model Context Protocol server in front of an existing API: curating tools rather than mirroring endpoints, choosing a transport, OAuth without token passthrough, returning errors the model can act on, paginating for a context window, and marking destructive operations."
category: "agents"
---

## The Server Is a New Client of Your API

A [Model Context Protocol](/specifications/model-context-protocol) server is an adapter. On one side it speaks [JSON-RPC](/specifications/json-rpc) to an AI application, offering tools the model can call; on the other it calls your HTTP API like any other client. Nothing about your API has to change for it to exist, which is exactly why so many are built badly: the quickest version wraps every endpoint as a tool, forwards whatever token arrives, and returns raw response bodies, and it works well enough in a demo to ship.

The conversion from an operation to a tool definition, and what survives it, is covered in [how an API becomes tool definitions](/guides/tool-definitions). Whether the underlying API is fit for an agent at all is the subject of the [agent-ready API checklist](/guides/agent-ready-checklist). This guide covers the layer between them: the server itself, and the decisions that are yours to make once you stop generating it mechanically.

MCP is revised in dated releases, and the protocol changed substantially in the 2026-07-28 revision, which removed connection-scoped sessions and the initialization handshake. What follows is written against that revision and sticks to the parts least likely to move. Check the current specification before relying on any wire-level detail.

---

## 1. Curate the Tools, Do Not Mirror the Endpoints

The most consequential decision is which tools exist, and the default answer, one tool per operation, is usually wrong.

Every tool definition is sent to the model before it does anything, so each one costs context on every request and competes with every other tool for selection. An API with 120 operations becomes 120 tools, most of which the model will never need and several of which it will confuse with each other. A person browsing a reference can skip what is irrelevant. A model has to reason over all of it.

Design the tool list as a product surface, around what a user would ask for:

| HTTP operations | Better as |
| :--- | :--- |
| `GET /orders`, `GET /orders/search`, `GET /customers/{id}/orders` | One `find_orders` tool with optional filters |
| `POST /refunds`, then `PATCH /orders/{id}`, then `POST /notifications` | One `refund_order` tool, if that sequence is one intention in your domain |
| `GET /orders/{id}`, `GET /orders/{id}/lines`, `GET /orders/{id}/shipments` | One `get_order` tool returning what a caller needs to answer a question about an order |
| `POST /admin/reindex`, `DELETE /tenants/{id}` | No tool at all |

Three rules follow:

- **Leave out what an agent should not do.** Administrative, bulk-destructive and billing-changing operations do not need to be reachable from a chat window just because they are reachable over HTTP. The cheapest control over a dangerous tool is not exposing it.
- **Compose where your domain composes.** If a refund is three calls that must happen in order, the server can make them, with proper error handling, instead of hoping the model sequences them correctly and stops when the second fails.
- **Keep reads and writes separate.** A tool that sometimes reads and sometimes writes, depending on an argument, cannot be marked accurately (see section 6), and it cannot be granted to a read-only user.

The list does not have to be the same for everyone. The specification allows the result of `tools/list` to vary by the authorization presented on the request, so a server can return only the tools the caller's scopes permit. It must not vary per connection or as a side effect of other calls, and it should come back in a deterministic order so clients can cache it.

---

## 2. Choose the Transport by Who Runs the Server

The protocol defines two standard transports, and the choice is mostly decided by deployment rather than preference.

| | stdio | Streamable HTTP |
| :--- | :--- | :--- |
| Runs | As a subprocess launched by the client, on the user's machine | As a network service you operate |
| Messages | Newline-delimited JSON-RPC over standard input and output | Each message an HTTP `POST` to a single MCP endpoint; the reply is a JSON object or a request-scoped server-sent events stream |
| Credentials | From the environment, such as an API key the user configured | OAuth, per the MCP authorization specification |
| Suits | Developer tools, local files, one user with their own API key | Hosted integrations, many users, anything you want to update without asking users to reinstall |

**For an existing public API, ship Streamable HTTP.** It is the transport that lets you control the version every user runs, apply authorization properly, observe usage and rate-limit it, all of which you already do for the API itself. A stdio package is a reasonable addition for developers who want to run locally with their own key, but it is a client library distributed to users, with the upgrade lag that implies.

Streamable HTTP is designed to sit behind the same infrastructure as your API. Each `POST` mirrors parts of the body into headers (`MCP-Protocol-Version`, `Mcp-Method`, and `Mcp-Name` for calls that target a named tool, resource or prompt) so a gateway can route, rate-limit and log by tool without parsing JSON. The body stays authoritative, and a server must reject a request whose headers disagree with it. A tool can also mirror an argument into an `Mcp-Param-{Name}` header with the `x-mcp-header` schema extension, for example a region used for routing. Never mark a credential or personal data that way: headers are visible to every intermediary.

Two requirements of the HTTP transport are easy to miss. Servers must validate the [`Origin`](/headers/origin) header on incoming connections, to defend against DNS rebinding, and a server run locally should bind to `127.0.0.1` rather than every interface. A local MCP server listening on `0.0.0.0` with no `Origin` check is reachable by any web page the user visits.

Because the current revision has no protocol-level session (no `initialize` handshake, no `Mcp-Session-Id`, no standalone `GET` stream), a server cannot rely on per-connection state to relate one tool call to the next. Where a workflow needs state, such as a draft that is built up over several calls, return an explicit handle from the tool that creates it and accept the handle as an argument on later calls. Treat the handle as a name, not a capability: check the caller's authorization against it on every call, exactly as you would for an identifier in a URL. This is the same discipline a stateless HTTP API already follows, which is one reason the current revision maps onto an existing API more cleanly than its predecessors.

Clients built for the handshake-based revisions (`2025-11-25` and earlier) still exist. The specification describes how each side detects the other's era and falls back; if you need to serve older clients, follow its backward-compatibility section rather than keeping session state of your own.

---

## 3. Authorization: The Server Is a Resource Server

For an HTTP-based server, the MCP authorization specification is built on [OAuth 2.1](/specifications/oauth2) and a set of supporting RFCs. In that model, **your MCP server is an OAuth resource server in its own right**, distinct from your API, and the rules that follow from that are the ones most often broken.

Discovery starts with a challenge. An unauthenticated request receives a [`401 Unauthorized`](/status-codes/401) whose [`WWW-Authenticate`](/headers/www-authenticate) header points at the server's protected resource metadata, and may name the scopes the request needs:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource",
                         scope="orders:read"
```

MCP servers must publish that metadata, defined by **RFC 9728** (OAuth 2.0 Protected Resource Metadata). It tells the client which authorization servers issue tokens for this resource:

```json
{
  "resource": "https://mcp.example.com",
  "authorization_servers": ["https://auth.example.com"],
  "scopes_supported": ["orders:read", "orders:write"],
  "bearer_methods_supported": ["header"]
}
```

Clients must request tokens for the specific MCP server using the `resource` parameter from RFC 8707 (Resource Indicators), and the server must check that every token it accepts was issued for it as the audience. Invalid or expired tokens get a `401`. A valid token without the needed scope gets a [`403 Forbidden`](/status-codes/403) with `error="insufficient_scope"` in the challenge, which lets the client ask the user for the additional scope rather than failing outright. See [insufficient scope](/errors/insufficient-scope).

**Do not pass the token through to your API.** The specification forbids an MCP server from accepting or forwarding tokens that were not issued for it, and the security guidance names token passthrough as an anti-pattern. A server that forwards the bearer token it received to the API behind it makes every audience check meaningless: the API trusts a token minted for a different resource, and a token stolen from any MCP client becomes a token for your API. The server should obtain its own credentials for the upstream call, for example by exchanging the token it validated for one issued to the API, or by acting under a service credential and carrying the user's identity in a form the API verifies.

Map MCP scopes to API permissions deliberately. A server holding a broad credential to your API and exposing a narrow set of tools is enforcing authorization itself, and has to do so on every call. See [authorization models](/guides/authorization-models) and [OAuth and API keys](/guides/oauth-api-keys).

Client registration is mostly a concern for your authorization server rather than the MCP server: the current revision prefers Client ID Metadata Documents, in which the `client_id` is an HTTPS URL the authorization server fetches, and keeps Dynamic Client Registration (RFC 7591) only as a deprecated fallback. If your authorization server supports neither, MCP clients you have not pre-registered cannot connect.

For stdio servers, the specification says not to use this flow and to take credentials from the environment instead.

---

## 4. Errors Go Back to the Model as Results

MCP has two error channels, and putting an API failure in the wrong one hides it from the model.

**Protocol errors** are JSON-RPC errors: an unknown tool, a request that does not match the `tools/call` schema, a server fault. Clients may show them to the model, but the specification notes they are less likely to lead to recovery.

**Tool execution errors** are ordinary results with `isError: true`. They are for exactly the failures your API produces: validation errors, business rule violations, upstream failures. Clients should pass them to the model so it can correct itself and try again.

So an HTTP error from your API is almost always a tool execution error. Translate the [problem details](/specifications/problem-details) body into text the model can act on, and keep the stable `type` so behavior does not depend on prose:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "content": [
      {
        "type": "text",
        "text": "Refund rejected (https://apiguide.dev/errors/resource-conflict): order ord_123 has already been fully refunded. Do not retry; call get_order to see existing refunds."
      }
    ],
    "isError": true
  }
}
```

How to translate the common cases:

| API response | What the tool result should tell the model |
| :--- | :--- |
| [`400`](/status-codes/400) or [`422`](/status-codes/422) with field errors | Which argument was wrong and what a valid value looks like, so the next call can fix it |
| [`404`](/status-codes/404) | That the identifier does not exist, and which tool finds valid ones |
| [`409`](/status-codes/409) | What the conflicting state is, and whether retrying could ever succeed |
| [`429`](/status-codes/429) with [`Retry-After`](/headers/retry-after) | That the call was rate limited and how long to wait. Better still, have the server wait and retry within reason |
| `5xx` | That the failure was on the service side and whether retrying is reasonable, without internal detail |
| Upstream `401` from your API | Not the model's problem. The server's own credential failed; log it and return a generic failure |

The last row matters. The model cannot fix a misconfigured service credential, and telling it the API returned `401` invites it to try a different tool, or to ask the user for a password.

Never return an error as a successful result with the failure buried in the text. A result without `isError` is a success to every client that branches on it, which is the MCP equivalent of an error returned with `200 OK`. See [error handling](/guides/error-handling).

---

## 5. Results Sized for a Context Window

Your API's list endpoints were sized for programs, which can page through ten thousand records without noticing. A tool result lands in a context window, where every record costs tokens and displaces the conversation.

- **Return a small first page.** Pick a default page size for each tool on what a model can usefully read, not on your API's maximum.
- **Pass pagination through as arguments and fields.** Accept a `cursor` argument and return the next cursor in the result, with a plain statement of whether more results exist. Never page through everything server-side to return one enormous result. See [pagination](/guides/pagination).
- **Project the fields.** Return what answers questions about the resource, not every column. If your API supports [sparse fieldsets](/guides/sparse-fieldsets), use them upstream.
- **Prefer filters to scrolling.** A `find_orders` tool with a status and date filter gets the model to the right ten records; a cursor gets it to the next fifty wrong ones.
- **Declare structure where it helps.** A tool may declare an `outputSchema` and return `structuredContent` conforming to it, which clients can validate. The specification recommends also returning the serialized JSON as text, for clients that do not read structured content.

Do not confuse your tools' pagination with the protocol's. `tools/list` itself is paginated with an opaque cursor, and that is about the list of tools, not the data a tool returns.

---

## 6. Mark What Is Destructive, Then Enforce It Anyway

Tool definitions can carry annotations describing behavior. Under the current schema:

| Annotation | Meaning when `true` | Default |
| :--- | :--- | :--- |
| `readOnlyHint` | The tool does not modify its environment | `false` |
| `destructiveHint` | The tool may perform destructive updates, rather than only additive ones | `true` |
| `idempotentHint` | Repeating the call with the same arguments has no additional effect | `false` |
| `openWorldHint` | The tool interacts with an open world of external entities | `true` |

`destructiveHint` and `idempotentHint` are meaningful only when `readOnlyHint` is `false`. The defaults are deliberately pessimistic: a tool with no annotations is assumed to write, possibly destructively, and not to be safe to repeat. Set them on every tool, and set them from the HTTP semantics of what the tool calls:

```json
{
  "name": "cancel_order",
  "description": "Cancel an unshipped order. Cannot be undone. Returns 409 if the order has shipped.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string", "description": "The order identifier, e.g. ord_123" }
    },
    "required": ["order_id"],
    "additionalProperties": false
  },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": true,
    "idempotentHint": true,
    "openWorldHint": false
  }
}
```

A tool backed only by [`GET`](/methods/get) is read-only. One backed by [`PUT`](/methods/put) or [`DELETE`](/methods/delete) is usually idempotent. One backed by [`POST`](/methods/post) is not, unless your API makes it so.

**The annotations are hints, and the specification says so.** Clients must treat them as untrusted unless the server is trusted, and should never base a tool-use decision on annotations from an untrusted server. A client may use them to decide when to ask the user for confirmation; nothing obliges it to. So they are a courtesy to well-behaved clients, not a control. The controls are on your side: scopes that restrict which tools a token can call, and the API's own authorization behind every call.

Where a write is irreversible, the server can ask for confirmation itself rather than trusting the client to. Under the current revision, a server that needs input mid-call returns an `input_required` result carrying an elicitation request, and the client retries the original call with the user's answer attached. A `delete_project` tool that will not proceed until the user has confirmed the project name, through the host rather than through the model, is a control that does not depend on any client honoring a hint.

Make writes safe to repeat, because the model will repeat them. A model that does not see a result, or does not believe it, calls the tool again, and from the server's side that is a new call, indistinguishable from a deliberate second request. Two measures help:

- **When the server retries an HTTP call itself**, send an [`Idempotency-Key`](/headers/idempotency-key) and reuse it across attempts, exactly as a good SDK would. See [idempotency](/guides/idempotency).
- **For creation tools, prefer designs that are naturally idempotent**, such as accepting a caller-chosen reference that the API deduplicates on, or a two-step draft-then-confirm flow using a handle. Say in the description what happens if the tool is called twice.

---

## 7. Before You Ship It

A short review for an MCP server in front of an existing API:

1. The tool list is curated by intention, small enough to read in one sitting, and excludes operations an agent should never perform.
2. Every tool description says when to use it, what comes back, and how it fails. See [how an API becomes tool definitions](/guides/tool-definitions).
3. The HTTP transport validates `Origin`, and a local server binds to localhost.
4. Protected resource metadata is published, token audience is validated, and no incoming token is ever forwarded upstream.
5. API failures come back as `isError` results with actionable text and the stable error `type`; protocol errors are reserved for protocol problems.
6. List tools return small pages with a cursor, and results are projected to what a model needs.
7. Every tool carries accurate annotations, and nothing depends on a client honoring them.
8. Usage is logged per tool and per user, so you can see what agents actually do with what you gave them. See [observability and tracing](/guides/observability-tracing).

Most of these are things your API already does for its human-facing clients. An MCP server is a new client, and it deserves the same care as the first one.
