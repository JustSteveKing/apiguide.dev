---
title: "OpenTelemetry"
description: "The CNCF standard for producing and exporting traces, metrics and logs: the API and SDK model, the OTLP wire protocol, HTTP semantic conventions and the Collector."
currentVersion: "1.61.0"
officialUrl: "https://opentelemetry.io/docs/specs/otel/"
updatedDate: 2026-10-14
---

## What is OpenTelemetry?

Every observability vendor used to ship its own agent, its own SDK and its own wire format. Instrumenting an API meant choosing a backend first and writing code against it, and changing backends meant re-instrumenting. OpenTelemetry (OTel) separates the two: you instrument once against a vendor-neutral API, and the data goes to whatever backend you configure.

OpenTelemetry is a graduated CNCF project. It is several things under one name, and it helps to keep them apart:

* **The specification**: the API, SDK and data model rules every language implementation follows. The page header above tracks its version.
* **OTLP**: the wire protocol for sending telemetry.
* **Semantic conventions**: the agreed attribute names, so that an HTTP span from a Go service and one from a Java service look the same.
* **The Collector**: a standalone service that receives, processes and forwards telemetry.

It does not store or visualize anything. That is the backend's job.

---

## 1. Signals and Their Status

| Signal | API | SDK | Protocol |
| :--- | :--- | :--- | :--- |
| Traces | Stable | Stable | Stable |
| Metrics | Stable | Mixed | Stable |
| Logs | Stable (Bridge API) | Stable | Stable |
| Baggage | Stable | Stable | N/A |
| Profiles | N/A | N/A | Development |

These are the specification's statuses. A given language SDK can lag behind them, so check your language's own status before depending on a signal in production.

The Logs API is a **bridge**: it exists so that your existing logging library can emit OTel log records with trace context attached, not to replace that library. Keep logging through the logger you have and install the bridge.

**Profiles** is the newest signal and is still in development. Its OTLP endpoint is versioned `/v1development/profiles` precisely so that nobody mistakes it for stable.

---

## 2. OTLP: The Wire Protocol

OTLP defines how telemetry travels from an SDK to a Collector or backend. It runs over gRPC or plain HTTP, with protobuf as the schema in both cases.

| | OTLP/gRPC | OTLP/HTTP |
| :--- | :--- | :--- |
| Default port | `4317` | `4318` |
| Encoding | Binary protobuf | Binary protobuf or JSON |
| Paths | gRPC service methods | `/v1/traces`, `/v1/metrics`, `/v1/logs` |

```http
POST /v1/traces HTTP/1.1
Host: collector.internal:4318
Content-Type: application/x-protobuf
Content-Encoding: gzip
```

OTLP/HTTP uses `application/x-protobuf` for binary and `application/json` for the JSON form, and the server answers in the same content type as the request. The JSON encoding follows the [Protocol Buffers](/specifications/protocol-buffers) JSON mapping with deliberate deviations: trace and span IDs are hex strings rather than base64, and enum values are integers.

The protocol's failure semantics are a good model for any ingestion API. [`429 Too Many Requests`](/status-codes/429), [`502 Bad Gateway`](/status-codes/502), [`503 Service Unavailable`](/status-codes/503) and [`504 Gateway Timeout`](/status-codes/504) are retryable, and the server may send [`Retry-After`](/headers/retry-after). Every other 4xx or 5xx must not be retried. A `200 OK` can carry a `partial_success` field reporting how many items were rejected, so check it rather than assuming a 200 means everything landed.

---

## 3. HTTP Semantic Conventions

The HTTP span conventions are stable. They fix the attribute names that make HTTP telemetry comparable across services:

| Attribute | Server span | Client span |
| :--- | :--- | :--- |
| `http.request.method` | Required | Required |
| `url.path` | Required | |
| `url.scheme` | Required | |
| `url.full` | | Required |
| `server.address` | Recommended | Required |
| `server.port` | Conditionally required | Required |
| `http.response.status_code` | Conditionally required | Conditionally required |
| `http.route` | Conditionally required | |
| `error.type` | Conditionally required | Conditionally required |

These replaced an older set (`http.method`, `http.status_code`, `http.url`, `http.target`), and the duration metrics were renamed and moved from milliseconds to seconds (`http.server.duration` became `http.server.request.duration`). If your dashboards query the old names and an instrumentation upgrade switches to the stable ones, your graphs go flat without an error anywhere. Migrate with `OTEL_SEMCONV_STABILITY_OPT_IN=http/dup`, which emits both sets, move the dashboards and alerts, then switch to `http`.

### Span names and status

Span names are `{method} {target}`, where the target is low-cardinality: `GET /orders/{id}`, built from `http.route`, never `GET /orders/ord_9f8e7d6c`. Instrumentation must not default to the raw URI path, because a span name per resource ID makes aggregation useless and the cardinality expensive.

Status is asymmetric by design. On a **server** span, a 4xx leaves span status unset: the server did its job by rejecting a bad request. On a **client** span, a 4xx should set status to `Error`, because the call the client wanted did not succeed. A 5xx is an error on both sides.

---

## 4. Propagation and the Collector

OTel's default propagators are `tracecontext,baggage`: [W3C Trace Context](/specifications/trace-context) for the [`traceparent`](/headers/traceparent) and [`tracestate`](/headers/tracestate) headers, plus W3C Baggage. HTTP client and server instrumentation inject and extract them automatically. If you need to interoperate with an older system, set `OTEL_PROPAGATORS` to add its format rather than replacing Trace Context.

The **Collector** sits between your services and your backend. Its configuration declares pipelines, one per signal, each running receivers, then processors, then exporters:

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlp]
```

Run one. Exporting straight from every service to a vendor puts credentials, retry logic and sampling policy in every process, and couples your deployments to the backend. A Collector lets the service offload data quickly, and gives you one place to batch, redact sensitive attributes, sample and switch backends.

---

## Best Practices

* Set `service.name` (via `OTEL_SERVICE_NAME`) on every service. Without it, your traces arrive attributed to an unknown service.
* Prefer instrumentation libraries for your framework and HTTP client over hand-written spans, then add manual spans around business operations that matter.
* Treat attributes as data you are publishing to your backend. Do not record request bodies, tokens or personal data in span attributes by default.
