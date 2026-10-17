---
name: "New Relic"
description: "A comprehensive APM and cloud monitoring tool providing real-time telemetry, transaction tracing, and alert configurations."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://newrelic.com"
pricing: "freemium"
updatedDate: 2026-10-14
---

## What is New Relic?

New Relic is a commercial SaaS observability platform. Language agents (Java, .NET, Node.js, Python, Ruby, PHP, Go) instrument web transactions, outbound HTTP calls and database queries; infrastructure agents, log forwarding, synthetic monitors and an OpenTelemetry (OTLP) endpoint feed the same account. All of it is stored as events and queried with NRQL, New Relic's SQL-like query language. Pricing is based on data ingested and on user seats, with a free tier that includes 100 GB of ingest per month and one full platform user.

## Why use it in the API Lifecycle?

* **Transaction-level APM**: Each web transaction is named after the route or controller, with throughput, response time, error rate and Apdex, plus traces of slow requests.
* **Distributed tracing**: Agents support W3C [Trace Context](/specifications/trace-context) (`traceparent` and `tracestate`) and can still send the older proprietary `newrelic` header; W3C-capable agents prefer `traceparent` when both arrive.
* **OpenTelemetry ingest**: Services instrumented with OpenTelemetry can export directly over OTLP to New Relic, so you are not tied to its agents.
* **NRQL**: Ad hoc queries and alert conditions can be written over transactions, spans, logs and metrics, for example the p95 duration of one route, faceted by status code.
* **Synthetic monitoring**: Scripted API monitors call endpoints on a schedule from managed or private locations and alert on failures.

## Best Practices

* Make sure transactions are named by route template, not by full URL. A transaction name per resource ID creates thousands of names, hits the agent's naming limits and makes per-endpoint metrics meaningless.
* Build alerts on rates, not counts: the error percentage and p95 or p99 duration per key transaction, over a window long enough to ignore single slow requests. A count of errors rises with traffic and pages you for a busy day.
* Separate client errors from server errors. Track 4xx and 5xx per route independently; a surge of [`401 Unauthorized`](/status-codes/401) after a client release is a different incident from a surge of [`500 Internal Server Error`](/status-codes/500), and only the second is the API team's fault.
* Propagate W3C [`traceparent`](/headers/traceparent) through every proxy and queue, and turn off the proprietary header once all services understand W3C, so traces join with OpenTelemetry-instrumented services. Agents use adaptive head-based sampling by default; use Infinite Tracing (tail-based) if you need to keep every slow or failed trace. See [Observability and Tracing](/guides/observability-tracing).
* Keep request parameters, headers and bodies out of captured attributes unless you need them, and use the agent's attribute include and exclude configuration to drop anything sensitive. Never capture [`Authorization`](/headers/authorization) or [`Cookie`](/headers/cookie). [Logging and PII](/guides/logging-pii) covers redaction.
* Watch ingest. Billing is per GB, so verbose logs and high-cardinality custom attributes are what drive cost; drop or sample noisy data at the source rather than paying to store it.
