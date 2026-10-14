---
name: "Datadog APM"
description: "An observability platform providing deep infrastructure monitoring, application performance monitoring (APM), and API log tracking."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://www.datadoghq.com"
pricing: "paid"
---

## What is Datadog APM?

Datadog is a commercial SaaS observability platform, and APM is its distributed tracing product. Language tracing libraries (`dd-trace` for Java, Python, Node.js, Go, .NET, Ruby, PHP and others) instrument HTTP servers, clients, databases and queues automatically, send spans through the Datadog Agent, and link them to the infrastructure metrics, logs and synthetic tests held in the same account. Datadog also accepts OpenTelemetry data. APM is billed per host on top of the platform; the free plan covers only basic infrastructure monitoring, so treat APM as a paid product.

## Why use it in the API Lifecycle?

* **Per-endpoint RED metrics**: Trace metrics (`trace.<span_name>.hits`, `.errors` and latency distributions) are calculated from 100% of application traffic regardless of trace ingestion sampling, so request rate, error rate and latency per route stay accurate even when most traces are dropped.
* **Distributed tracing across services**: The tracers extract and inject Datadog, W3C [Trace Context](/specifications/trace-context) and baggage headers by default, so a trace can follow a request through services instrumented with Datadog or OpenTelemetry.
* **Correlated logs and traces**: Trace and span IDs injected into logs let you jump from a slow or failing request to the log lines it produced.
* **Synthetic API tests**: HTTP, gRPC, WebSocket, SSL, DNS and TCP checks, plus multistep API tests that chain requests, run against production from managed locations.
* **Deployment tracking**: With unified service tagging (`env`, `service`, `version`), latency and error rates can be compared across versions to spot a bad release.

## Best Practices

* Set `DD_ENV`, `DD_SERVICE` and `DD_VERSION` on every service from day one. Without the `version` tag you cannot compare a deploy against the one before it, which is the first question in most incidents.
* Make sure resource names are route templates (`GET /orders/{id}`), not raw paths. A resource per order ID destroys aggregation and makes per-endpoint dashboards useless; fix it in the framework integration or with resource renaming rules.
* Decide which status codes are errors. Tracers mark server spans as errors for 5xx by default and that is the right default: a [`404 Not Found`](/status-codes/404) or [`422 Unprocessable Content`](/status-codes/422) is the API working. Alert separately on spikes in [`401 Unauthorized`](/status-codes/401) or [`429 Too Many Requests`](/status-codes/429), which point at a client or credential problem rather than a server fault.
* Propagate W3C [`traceparent`](/headers/traceparent) and [`tracestate`](/headers/tracestate) across every hop, including gateways and queues. If one proxy strips them, the trace breaks in two and the slow span becomes invisible. See [Observability and Tracing](/guides/observability-tracing).
* Keep secrets and personal data out of spans. Query strings in `http.url` are redacted by pattern by default; extend `DD_TRACE_OBFUSCATION_QUERY_STRING_REGEXP` for your own token parameters, only collect headers explicitly through `DD_TRACE_HEADER_TAGS`, and never add [`Authorization`](/headers/authorization) or [`Cookie`](/headers/cookie). [Logging and PII](/guides/logging-pii) covers what to redact.
* Control cost with ingestion sampling rather than by turning tracing off. Error and RED metrics remain complete at any sampling rate, so keep 100% only where you need every trace.
* Point a multistep synthetic API test at the critical journey (authenticate, create, read back) and assert on status, latency and the response fields a client depends on, so you learn about an outage before your consumers do.
