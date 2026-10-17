---
title: "JSON-RPC 2.0"
description: "A minimal, transport-agnostic remote procedure call protocol in JSON: requests, responses, notifications, batches and the reserved error codes, and the base protocol under MCP."
currentVersion: "2.0"
officialUrl: "https://www.jsonrpc.org/specification"
updatedDate: 2026-10-14
---

## What is JSON-RPC?

Sometimes an API is not a set of resources but a set of operations: "run this tool", "cancel that job", "tell me when something changes". Forcing those onto URLs and [`POST`](/methods/post) bodies produces an RPC protocol anyway, just an undocumented one. JSON-RPC 2.0 is the documented one. It defines a request object, a response object, a notification, a batch and a small set of error codes, and nothing else.

The whole specification fits on one page and has not changed since 2013. It is stateless and transport-agnostic: the same messages work over HTTP, a WebSocket, a pipe to a child process or standard input and output. That neutrality is why the [Model Context Protocol](/specifications/model-context-protocol) and [A2A](/specifications/a2a) both build on it.

---

## 1. Requests and Responses

A request names a method and optionally passes parameters, either by position (an array) or by name (an object):

```json
{
  "jsonrpc": "2.0",
  "method": "orders.get",
  "params": { "orderId": "ord_9f8e7d6c" },
  "id": 7
}
```

| Member | Rule |
| :--- | :--- |
| `jsonrpc` | Must be exactly `"2.0"`. |
| `method` | The method name. Names starting with `rpc.` are reserved for the protocol's own extensions. |
| `params` | Optional. An array (by position) or an object (by name). |
| `id` | A string, number or `null`. Should not be `null`, and numbers should not have fractional parts. |

The response echoes the `id` and carries exactly one of `result` or `error`, never both:

```json
{
  "jsonrpc": "2.0",
  "result": { "orderId": "ord_9f8e7d6c", "status": "shipped" },
  "id": 7
}
```

The `id` is how the client matches a response to its request, and it is the only way: responses are not guaranteed to arrive in request order. Use strings or integers, unique among the requests you have in flight.

**Prefer named parameters.** Positional `params` break every caller the moment you insert an argument, while named ones let you add optional parameters freely, the same additive evolution you would expect of a JSON body.

---

## 2. Notifications

A request without an `id` is a **notification**. The server must not reply to it, not even with an error.

```json
{
  "jsonrpc": "2.0",
  "method": "jobs.progress",
  "params": { "jobId": "job_42", "percent": 60 }
}
```

That makes notifications fire-and-forget by definition: the sender never learns whether the method existed, whether the parameters were valid, or whether it succeeded. Use them for events whose loss is acceptable, such as progress updates or log lines, and never for anything the sender would need to retry.

---

## 3. Errors

An error response carries an object with an integer `code`, a short `message` and an optional `data` member for detail:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": { "field": "orderId", "reason": "must start with ord_" }
  },
  "id": 7
}
```

The specification reserves these codes:

| Code | Message | Meaning |
| :--- | :--- | :--- |
| `-32700` | Parse error | The server received invalid JSON. |
| `-32600` | Invalid Request | The JSON is not a valid request object. |
| `-32601` | Method not found | The method does not exist or is not available. |
| `-32602` | Invalid params | The parameters are invalid for the method. |
| `-32603` | Internal error | An internal JSON-RPC error. |
| `-32000` to `-32099` | Server error | Reserved for implementation-defined server errors. |

For a parse error or an invalid request, where the server cannot determine the `id`, the response `id` is `null`.

Define your application errors outside the reserved range (-32768 to -32000), document them, and put machine-readable detail in `data`. Do not overload `-32603` for every business failure: a client cannot tell "your order was declined" from "the server crashed" if both arrive as an internal error.

---

## 4. Batches

A client may send an array of requests. The server may process them in any order, including concurrently, and returns an array of responses in any order, matched by `id`:

```json
[
  { "jsonrpc": "2.0", "method": "orders.get", "params": { "orderId": "ord_1" }, "id": "a" },
  { "jsonrpc": "2.0", "method": "jobs.progress", "params": { "jobId": "job_42", "percent": 80 } },
  { "jsonrpc": "2.0", "method": "orders.get", "params": { "orderId": "ord_2" }, "id": "b" }
]
```

Notifications in a batch get no entry in the response. If the batch contains only notifications, the server returns nothing at all, not an empty array.

Protocols built on JSON-RPC do not always carry batching over: MCP removed support for it in its 2025-06-18 revision. Check the protocol you are implementing before sending one.

---

## 5. JSON-RPC over HTTP

The specification says nothing about HTTP. That gap is where most implementations go wrong, so decide the mapping explicitly:

* Send every call as a `POST` to a single endpoint, with `Content-Type: application/json`.
* Return [`200 OK`](/status-codes/200) for any response that is a valid JSON-RPC response, including error responses. The JSON-RPC `error` object is the error channel.
* Reserve HTTP errors for failures before JSON-RPC is reached: [`401 Unauthorized`](/status-codes/401) for missing credentials, [`413 Content Too Large`](/status-codes/413) for an oversized body.
* Return [`204 No Content`](/status-codes/204) or [`202 Accepted`](/status-codes/202) for a notification, since there is no response body to send.

Because everything is a `POST` to one URL, HTTP caching, per-route rate limits and access logs see nothing useful. If those matter more than a uniform operation model, a resource-oriented HTTP API is the better fit.
