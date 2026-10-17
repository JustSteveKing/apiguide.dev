---
title: "Connect and gRPC-Web"
description: "A reference for the two protocols that carry Protocol Buffers RPCs to browsers and over HTTP/1.1: the Connect protocol, with plain JSON unary calls, GET for side-effect-free methods and JSON errors, and gRPC-Web, with trailers in the body and a translating proxy."
currentVersion: "Connect protocol v1; gRPC-Web (PROTOCOL-WEB)"
officialUrl: "https://connectrpc.com/docs/protocol/"
updatedDate: 2026-10-17
---

## Why gRPC needs a second protocol

[gRPC](/specifications/grpc) is defined over [HTTP/2](/specifications/http2) and depends on two things browsers do not give JavaScript: control over HTTP/2 framing, and access to HTTP trailers, where gRPC puts the status of every call. A browser cannot speak native gRPC, and neither can a lot of infrastructure that only handles HTTP/1.1 cleanly.

Two protocols answer that problem, and this page covers both because you choose between them, not in addition to them. **gRPC-Web** is the gRPC project's own answer: a minimal change to the gRPC wire format that moves trailers into the body, so it works over any HTTP version, usually with a proxy translating to native gRPC on the server side. **Connect** is a newer protocol from Buf, now a Cloud Native Computing Foundation sandbox project, that goes further: unary calls are ordinary HTTP requests with ordinary JSON or binary [Protocol Buffers](/specifications/protocol-buffers) bodies, readable in a network inspector and callable with curl.

The recommendation: if you are starting fresh and control the server, use a Connect implementation. Connect servers also accept gRPC and gRPC-Web requests natively, without a proxy, so you lose nothing. Use gRPC-Web on its own when you already run native gRPC servers and an Envoy layer, and only need to add browsers. For choosing RPC over REST at all, see [choosing an API style](/guides/choosing-api-style).

---

## 1. Connect unary calls

A unary Connect call is a `POST` to `/package.Service/Method` with the message as the body:

```http
POST /acme.weather.v1.WeatherService/GetCity HTTP/1.1
Host: api.example.com
Content-Type: application/json
Connect-Protocol-Version: 1
Connect-Timeout-Ms: 5000

{"cityId": "lon"}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"name": "London"}
```

| Header | Meaning |
| :--- | :--- |
| `Content-Type` | `application/json` or `application/proto` for unary calls |
| `Connect-Protocol-Version` | `1`. Clients should send it; servers and proxies may reject requests without it with `400` |
| `Connect-Timeout-Ms` | Deadline in milliseconds, a positive integer of at most 10 digits. Absent means no timeout |

The path is case-sensitive and may carry a routing prefix. Nothing else about it is designed: there are no path parameters and no query strings for unary `POST`.

### GET for side-effect-free methods

A method marked `idempotency_level = NO_SIDE_EFFECTS` in its Protobuf definition can also be called with [`GET`](/methods/get), which makes it cacheable by browsers and CDNs. Handlers support it automatically; clients have to opt in. The message moves into the query string:

```http
GET /acme.weather.v1.WeatherService/GetCity?connect=v1&encoding=json&message=%7B%22cityId%22%3A%22lon%22%7D HTTP/1.1
Host: api.example.com
```

| Parameter | Meaning |
| :--- | :--- |
| `message` | The percent-encoded message |
| `encoding` | `json` or `proto` |
| `base64` | `1` when `message` is URL-safe base64, required for binary encodings |
| `compression` | A content coding such as `gzip` |
| `connect` | `v1`. Clients should send it; servers may reject GETs without it |

The timeout stays in the `Connect-Timeout-Ms` header. Enable GET for read methods that are hot and cacheable; it is the one thing Connect offers that native gRPC structurally cannot.

---

## 2. Connect errors

A failed unary call returns a non-200 status and a JSON body, always `application/json` even when the request used Protobuf:

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{"code": "not_found", "message": "no city with id lon"}
```

`code` is required; `message` and `details` are optional. Each entry in `details` has a fully qualified Protobuf `type` and a base64 `value`. The codes are gRPC's, in snake case, with a fixed HTTP mapping:

| Code | HTTP | Code | HTTP |
| :--- | :--- | :--- | :--- |
| `canceled` | 499 | `aborted` | [`409`](/status-codes/409) |
| `unknown` | [`500`](/status-codes/500) | `out_of_range` | [`400`](/status-codes/400) |
| `invalid_argument` | `400` | `unimplemented` | [`501`](/status-codes/501) |
| `deadline_exceeded` | [`504`](/status-codes/504) | `internal` | `500` |
| `not_found` | [`404`](/status-codes/404) | `unavailable` | [`503`](/status-codes/503) |
| `already_exists` | `409` | `data_loss` | `500` |
| `permission_denied` | [`403`](/status-codes/403) | `unauthenticated` | [`401`](/status-codes/401) |
| `resource_exhausted` | [`429`](/status-codes/429) | `failed_precondition` | `400` |

`499` is the non-standard "client closed request" code; do not expect it from intermediaries. When a response has no Connect error body, for example a `502` from a load balancer, clients infer a code from the status: `401` becomes `unauthenticated`, `404` becomes `unimplemented`, `429` and `502` to `504` become `unavailable`, and everything else `unknown`.

Do not invent error codes or put the error in a `200` body. The fixed mapping is what lets generic HTTP tooling, retries and dashboards understand a Connect API without knowing it is one.

---

## 3. Connect streaming

Streaming calls use `application/connect+json` or `application/connect+proto`, always return `200`, and frame every message in an envelope:

```text
+--------+--------------------+------------------+
| flags  | length             | message          |
| 1 byte | 4 bytes, big-endian| length bytes     |
+--------+--------------------+------------------+
```

Bit 0 of `flags` marks a compressed message; bit 1 marks the **end-of-stream message**, a final JSON object carrying `error` (absent on success) and `metadata`, which stands in for trailers. Because the status is in the body, a streaming response that fails halfway still has a `200` status line. Clients must read to the end-of-stream message before treating a stream as successful.

Servers should answer a streaming request whose content type does not begin with `application/connect+` with [`415 Unsupported Media Type`](/status-codes/415).

---

## 4. gRPC-Web

gRPC-Web keeps the gRPC message framing (one flag byte, a four-byte length, the message) and changes only what the browser cannot do:

| Aspect | gRPC-Web |
| :--- | :--- |
| Content type | `application/grpc-web`, `application/grpc-web+proto`, or `application/grpc-web-text` for base64 |
| Transport | Any HTTP version; no dependence on HTTP/2 framing |
| Trailers | Sent as the last framed message, with the most significant bit of the flag byte set (`0x80`), encoded as an HTTP/1 header block with lowercase names |
| User agent | Clients send `X-User-Agent`, because the browser owns `User-Agent` |

```http
POST /acme.weather.v1.WeatherService/GetCity HTTP/1.1
Host: api.example.com
Content-Type: application/grpc-web+proto
Accept: application/grpc-web+proto
X-User-Agent: grpc-web-javascript/0.1
```

The `-text` variant base64-encodes the whole stream so that it survives environments that cannot handle binary response streaming.

The protocol is designed to be translated by a proxy. Native gRPC servers do not speak it, so something has to sit in front: [Envoy](/tools/gateways-management/envoy) is the default and supports it out of the box. The official `grpc-web` JavaScript client supports unary calls and server streaming (server streaming only in `grpcwebtext` mode); client streaming and bidirectional streaming are not supported.

---

## 5. Choosing between them

| Question | Connect | gRPC-Web |
| :--- | :--- | :--- |
| Callable with curl and plain JSON | Yes | No: binary framing even with JSON |
| Needs a proxy in front of the server | No | Yes, unless the server implements it |
| Cacheable GET for reads | Yes, for `NO_SIDE_EFFECTS` methods | No |
| Works with existing native gRPC servers | Connect servers serve all three protocols | Yes, via Envoy |
| Browser streaming | Server streaming only | Server streaming only |

No browser protocol gives you client or bidirectional streaming today, because browsers do not support streaming request bodies across the board. If you need full duplex in a browser, that is a [WebSocket](/specifications/websocket) problem, not an RPC protocol choice.

---

## Best Practices

* Send `Connect-Protocol-Version: 1` and `connect=v1` from every client. Servers are allowed to reject calls without them, and some proxies route on them.
* Mark read methods `NO_SIDE_EFFECTS` and enable GET where responses are cacheable.
* Never treat a streaming `200` as success until the end-of-stream message or trailers arrive.
* Use the snake-case Connect codes and their fixed HTTP statuses, not ad hoc error shapes, so the same client handles Connect, gRPC and gRPC-Web failures alike.
