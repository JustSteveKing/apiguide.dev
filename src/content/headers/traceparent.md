---
name: "traceparent"
description: "W3C Trace Context header carrying the trace ID, the caller's span ID and the sampling flag, so one request can be followed across every service it touches."
category: "request"
standard: true
relatedCodes: []
---

## What is the traceparent header?

The `traceparent` request header, defined in the W3C Recommendation [Trace Context](https://www.w3.org/TR/trace-context/), identifies the distributed trace an incoming request belongs to and the operation that made it. Every service that receives it records its own work against the same trace ID, then sends an updated `traceparent` on its own outgoing calls. That is what lets a tracing backend stitch spans from different services, languages and vendors into one trace. See [Trace Context](/specifications/trace-context) for the specification as a whole.

The name is lowercase by convention: the Recommendation says vendors SHOULD send it lowercase and MUST accept it in any case. It is a single word with no hyphen.

Version `00`, the only version the Recommendation defines, has four fields separated by dashes, all lowercase hex:

```text
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             |  |                                |                |
             |  trace-id (32 hex, 16 bytes)      |                trace-flags (2 hex)
             version (2 hex)                     parent-id (16 hex, 8 bytes)
```

| Field | Length | Rules |
| :--- | :--- | :--- |
| `version` | 2 hex digits | `00` today. `ff` is forbidden. |
| `trace-id` | 32 hex digits (16 bytes) | Identifies the whole trace. All zeros is invalid. |
| `parent-id` | 16 hex digits (8 bytes) | The caller's span, often called the span ID. All zeros is invalid. |
| `trace-flags` | 2 hex digits (8 bits) | Bit 0 (`01`) is `sampled`. Other bits are reserved and must be set to zero. |

The whole value is 55 characters. Uppercase hex is not allowed: if `trace-id` or `parent-id` is invalid, including when it is all zeros or contains non-lowercase hex characters, the receiver MUST ignore the header.

## API Usage & Best Practices

* **Replace `parent-id` on every outgoing call.** The trace ID stays the same for the whole trace; the parent ID is the ID of the span making the call. Forwarding the header you received unchanged makes your service invisible in the trace, and the Recommendation lists updating `parent-id` as the default mutation.
* **Test the sampled bit with a mask.** `trace-flags` is a bit field. Check `flags & 0x01`, not `flags == "01"`, so that a future flag does not turn sampling off. Trace Context Level 2, a Candidate Recommendation Draft, already defines a second bit (`02`) meaning the trace ID is random.
* **Do not continue untrusted traces blindly.** At a public edge, an attacker can send `traceparent` with the sampled bit set on every request and run up your tracing bill or pollute your data, which the Recommendation's security section warns about. Restart the trace (a new trace ID and parent ID) for unauthenticated traffic, or make your own sampling decision and keep the caller's trace ID only as a link.
* **Generate IDs randomly.** The Recommendation says `trace-id` SHOULD be globally unique and that random generation is preferred. Never derive it from anything identifying a user, such as an IP address.
* **Log the trace ID with every line.** It is the join key between your logs and your traces. See [observability and tracing](/guides/observability-tracing).
* **Do not invent a parallel header.** `X-Request-Id`, `X-B3-TraceId` and vendor-specific headers predate Trace Context. If you still need one for compatibility, propagate both, but treat `traceparent` as the source of truth. [OpenTelemetry](/specifications/opentelemetry) propagates it by default.
* **Allow it in CORS if browsers send it.** A browser app that adds `traceparent` to cross-origin calls needs it in [`Access-Control-Allow-Headers`](/headers/access-control-allow-headers), or the preflight fails.
* **Pair it with `tracestate`.** Vendor-specific data rides in [`tracestate`](/headers/tracestate). A receiver that cannot parse `traceparent` must not parse `tracestate` either.

## Examples

An API gateway receiving a sampled request:

```http
GET /v1/orders/ord_9 HTTP/1.1
Host: api.example.com
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

The gateway's own call to the orders service: the same trace ID, a new parent ID for the gateway's span, still sampled:

```http
GET /orders/ord_9 HTTP/1.1
Host: orders.internal
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01
```

A request the caller did not sample. Downstream services can still propagate it and may choose to record:

```http
GET /v1/orders/ord_9 HTTP/1.1
Host: api.example.com
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00
```
