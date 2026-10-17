---
name: "Dynatrace APM"
description: "Enterprise APM providing automatic service discovery, full-stack tracing, and AI-driven diagnostic alerts."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://www.dynatrace.com"
pricing: "paid"
updatedDate: 2026-10-14
---

## What is Dynatrace APM?

Dynatrace is a commercial observability platform. Its OneAgent installs on a host, container or Kubernetes cluster and instruments the processes it finds without code changes, discovering services and the calls between them and recording distributed traces. It also ingests OpenTelemetry traces, metrics and logs. Data is stored in Grail, Dynatrace's data lakehouse, and queried with the Dynatrace Query Language (DQL). Davis, its AI engine, correlates anomalies into problems with a suspected root cause. Pricing is a commitment-based Dynatrace Platform Subscription with a free trial and no free tier.

## Why use it in the API Lifecycle?

* **Automatic instrumentation**: OneAgent discovers HTTP services and traces requests end to end without per-service SDK work, which suits large estates where not every team will add instrumentation.
* **Service-level failure rates**: Each service gets request rate, response time and failure rate, with failure detection rules that decide which HTTP status codes and exceptions count as failures.
* **Mixed instrumentation**: Traces from OneAgent and OpenTelemetry land in the same store, and OneAgent can produce traces compatible with W3C [Trace Context](/specifications/trace-context).
* **Querying with DQL**: Spans, logs and metrics can be filtered and aggregated by attributes such as route, status code and service in one query language.
* **Synthetic and real-user monitoring**: HTTP monitors check API endpoints from outside, and real-user monitoring shows how API latency affects front ends.

## Best Practices

* Review the failure detection rules for each API service. By default only 5xx responses count as server-side failures, which is correct for most APIs, but if your service returns [`200 OK`](/status-codes/200) with an error body you must add a rule on that attribute, and if a dependency's [`503 Service Unavailable`](/status-codes/503) is handled by a fallback you may want to exclude it.
* Do not reclassify [`404 Not Found`](/status-codes/404) or [`409 Conflict`](/status-codes/409) as failures globally. They are correct answers to bad requests; track them as a separate client-error rate per route so a broken client release is visible without paging the API team.
* Enable W3C Trace Context compatibility in OneAgent settings and make sure gateways forward [`traceparent`](/headers/traceparent) and [`tracestate`](/headers/tracestate), so traces stay joined across OpenTelemetry-instrumented and OneAgent-instrumented services. See [Observability and Tracing](/guides/observability-tracing).
* Keep tokens and personal data out of captured request attributes. Capture only the headers and parameters you need for diagnosis, never [`Authorization`](/headers/authorization) or [`Cookie`](/headers/cookie), and configure masking before you capture request bodies. [Logging and PII](/guides/logging-pii) lists what to redact.
* Name services and endpoints by route template, not raw URL, so that per-endpoint response time and failure rate aggregate across IDs.
* Treat Davis problems as a starting point. Confirm a suspected root cause against the trace and the deploy timeline before acting on it.
