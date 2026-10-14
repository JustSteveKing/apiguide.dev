---
title: "W3C Trace Context"
description: "The W3C Recommendation that standardizes the traceparent and tracestate headers, so a distributed trace survives every hop between services, vendors and languages."
currentVersion: "Level 1 (W3C Recommendation)"
officialUrl: "https://www.w3.org/TR/trace-context/"
---

## What is W3C Trace Context?

A distributed trace is only useful if every service in the request path agrees on which trace a request belongs to. Before Trace Context, each tracing vendor shipped its own propagation headers, so a request that crossed from a service instrumented with one vendor's agent into a service instrumented with another's lost its trace at the boundary, and a gateway or load balancer that did not recognize the headers dropped them entirely.

W3C Trace Context fixes this with two HTTP headers and precise rules for parsing, mutating and forwarding them: [`traceparent`](/headers/traceparent), which identifies the trace and the calling span in a fixed format every participant can read, and [`tracestate`](/headers/tracestate), which carries vendor-specific data alongside it. Level 1 is a W3C Recommendation, and it is the propagation format OpenTelemetry uses by default. For the wider practice of tracing an API, see [observability and tracing](/guides/observability-tracing).

---

## 1. The traceparent Header

`traceparent` is four lowercase hex fields separated by dashes:

```http
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

| Field | Size | Meaning |
| :--- | :--- | :--- |
| `version` | 1 byte (2 hex) | Format version. `00` is the current one; `ff` is invalid. |
| `trace-id` | 16 bytes (32 hex) | Identifies the whole trace. Constant across every hop. |
| `parent-id` | 8 bytes (16 hex) | The ID of the span that made this request, as known by the caller. |
| `trace-flags` | 1 byte (2 hex) | Bit field. The least significant bit is `sampled`. |

An all-zero `trace-id` or `parent-id` is invalid, and a receiver must ignore a `traceparent` carrying one. Upper-case hex is invalid too: the spec requires lowercase, so do not normalize on your way out by uppercasing IDs for display and then reusing that string.

The `sampled` flag means the caller *may* have recorded trace data. It is a hint, not an order. A service can still apply its own sampling policy, but if it wants traces to be complete end to end it should respect the flag. Treat `trace-flags` as a bit field and mask it; do not compare the hex value to `01`, because later versions define other bits.

### Forward compatibility

A receiver that sees a version higher than it knows must not reject the header outright. If the header is at least 55 characters, it parses `trace-id`, `parent-id` and the `sampled` bit from their known positions, ignores anything after them, and sends version `00` downstream. This is what lets the format evolve without breaking deployed services.

---

## 2. The tracestate Header

`tracestate` carries vendor-specific context that does not fit in `traceparent`: a vendor's own span ID, a sampling probability, a tenant identifier.

```http
tracestate: congo=t61rcWkgMzE,rojo=00f067aa0ba902b7
```

It is a comma-separated list of `key=value` members, at most 32 of them. Keys are lowercase, and multi-tenant systems use the `tenant@system` form. Values are up to 256 printable ASCII characters, excluding comma and equals.

The rules for modifying it matter more than the syntax:

* A participant updates **only its own entry**, and moves it to the front of the list (the leftmost entry is the most recent).
* It must pass every other vendor's entry through unchanged.
* Propagate at least 512 characters of the combined header. If you must truncate, remove whole entries, longest first (anything over 128 characters), then from the end of the list.

`tracestate` without a valid `traceparent` is meaningless. If `traceparent` fails to parse, discard `tracestate` as well.

---

## 3. How a Service Handles the Headers

Every participant in a trace does the same three things:

1. **Read** the incoming `traceparent`. If it is valid, adopt its `trace-id`. If it is missing or invalid, start a new trace with a fresh random `trace-id`.
2. **Create** a span for its own work, with a new random `parent-id` value.
3. **Forward** a `traceparent` on every outbound call with the same `trace-id`, its own span ID as `parent-id`, and the flags it decided on.

```http
GET /inventory/sku_42 HTTP/1.1
Host: inventory.internal
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01
tracestate: congo=ucfJifl5GOE,rojo=00f067aa0ba902b7
```

Only the `parent-id` changed between hops; the `trace-id` stayed fixed. That fixed ID is what joins logs and spans from different services into one story, so write it into your structured logs as well.

### Trust at the edge

A public API receives `traceparent` from clients you do not control. Do not let an untrusted caller dictate your sampling, or reuse their `trace-id` in a way that lets them correlate or pollute your internal traces. A reasonable edge policy is to start a fresh trace for external requests and record the client's `traceparent` as a link or attribute, rather than adopting it as the parent.

---

## 4. Level 2 and W3C Baggage

**Trace Context Level 2** is a W3C Candidate Recommendation Draft, not yet a Recommendation. Its main addition is a second flag: the `random-trace-id` bit (`02`) in `trace-flags`, which declares that at least the rightmost 7 bytes of the `trace-id` were generated randomly. Samplers and storage systems can then rely on those bytes for consistent probability sampling and sharding. Level 1 parsers already mask the flags field, so they are unaffected.

**W3C Baggage** is a separate specification, currently a Candidate Recommendation, that defines a `baggage` header for propagating application-defined key-value pairs alongside the trace:

```http
baggage: userId=alice,serverNode=DF%2028,isProduction=false
```

Baggage is not part of `tracestate`. `tracestate` is for tracing systems' own state; baggage is for your application's context, and every downstream service and third party in the path can read it. Never put credentials or personal data in baggage, and strip it at your trust boundary before calling an external API.

---

## Best Practices

* Use your tracing library's propagator rather than parsing the headers by hand. [OpenTelemetry](/specifications/opentelemetry) ships Trace Context and Baggage propagators and enables both by default.
* Allow `traceparent`, `tracestate` and `baggage` through every proxy, gateway and CORS policy in the path. A component that strips them silently splits the trace in two.
* Generate IDs from a random source. Sequential or timestamp-derived trace IDs break sampling decisions that assume randomness, and leak information.
