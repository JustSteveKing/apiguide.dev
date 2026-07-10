---
title: "Observability & Distributed Tracing"
description: "Make your API debuggable in production with structured logging, RED and USE metrics, W3C Trace Context, correlation IDs, and OpenTelemetry."
category: "core"
---

## Introduction to Observability

Observability is the ability to understand what your system is doing internally from the signals it emits. For APIs, especially those built from many cooperating services, a single request can touch a dozen components. When it fails or slows down, you need to reconstruct exactly what happened.

The three pillars are **logs**, **metrics**, and **traces**. Used together they let you move from "something is wrong" to "here is the exact failing call" in minutes rather than hours.

---

## 1. Structured Logging

Log in a machine-parseable format (JSON), not free text. Structured logs can be filtered, aggregated, and correlated by field.

```json
{
  "timestamp": "2026-07-10T09:00:00.123Z",
  "level": "error",
  "message": "payment declined",
  "request_id": "b7e2c1",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "user_id": 7,
  "status": 402,
  "duration_ms": 43
}
```

Always attach a correlation identifier (below) to every line, use consistent field names across services, and never log secrets or full request bodies containing personal data.

---

## 2. Metrics: RED and USE

Metrics are cheap, aggregated numbers ideal for dashboards and alerts. Two complementary frameworks tell you where to look.

**RED** describes request-driven services (your API surface):

- **Rate** — requests per second.
- **Errors** — failed requests per second.
- **Duration** — latency distribution (track percentiles, not averages).

**USE** describes resources (the machines underneath):

- **Utilization** — how busy a resource is.
- **Saturation** — queued work it cannot yet handle.
- **Errors** — resource-level error counts.

RED tells you the API is slow; USE tells you the database CPU is the reason.

---

## 3. W3C Trace Context

To trace a request across service boundaries, context must propagate with it. The W3C Trace Context standard defines two headers so tracing works across vendors and languages.

```http
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
tracestate: vendorA=t61rcWkgMzE,vendorB=xyz
```

The `traceparent` header carries four dash-separated fields: version, a 16-byte **trace-id** (constant for the whole request), an 8-byte **parent-id** (the calling span), and trace flags (such as the sampled bit). `tracestate` carries optional vendor-specific data. Every service must read these headers, create its own child span, and pass an updated `traceparent` downstream.

---

## 4. Correlation & Request IDs

Even without full tracing, assign every inbound request a unique ID and echo it back so clients and support teams can reference a specific call.

```http
HTTP/1.1 200 OK
X-Request-Id: b7e2c1
```

If a client supplies a request ID, honour it; otherwise generate one at the edge. Propagate the same ID (and the `trace_id`) into every log line and downstream call. This is the thread that stitches disparate logs into a single story.

---

## 5. Distributed Tracing

A trace is a tree of **spans**, each representing one unit of work (an HTTP handler, a database query, an external call) with a start time, duration, and metadata. Linked by the shared trace-id, spans reveal exactly where time went across services.

Traces answer questions metrics cannot: not just "the p99 is 800ms" but "the p99 is 800ms *because* the auth service adds 600ms on cache misses." They are the fastest way to find the bottleneck in a multi-service request.

---

## 6. OpenTelemetry

OpenTelemetry (OTel) is the vendor-neutral CNCF standard for generating and exporting logs, metrics, and traces. It provides SDKs for most languages and a Collector that receives, processes, and forwards telemetry to any backend.

Adopting OTel means:

- **No vendor lock-in** — instrument once, switch backends by reconfiguring the exporter.
- **Automatic propagation** — its instrumentation handles W3C Trace Context for you.
- **Unified signals** — logs, metrics, and traces share consistent attributes, so a `trace_id` in a log links straight to the trace.

Instrument at the framework layer for broad coverage, add manual spans around business-critical operations, and sample intelligently so trace volume stays affordable at scale.
