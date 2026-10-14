---
name: "Honeycomb"
description: "An OpenTelemetry-native observability platform built on high-cardinality events, for querying production behavior without pre-aggregation."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://www.honeycomb.io"
pricing: "freemium"
---

## What is Honeycomb?

Honeycomb is a hosted observability platform built on high-cardinality events rather than pre-aggregated metrics. Every span or event can carry an unlimited number of custom fields, and queries slice across any of them at read time, so you can ask which customer, endpoint, build or region a latency spike belongs to without having decided in advance to track that dimension. It describes itself as OpenTelemetry-native: the recommended way to send data is the OpenTelemetry SDKs. Pricing is primarily by event volume, with a Free plan, a Pro plan and an Enterprise plan; metrics and the telemetry pipeline are priced separately.

## Why use it in the API Lifecycle?

* **High-cardinality queries**: Group and filter on user IDs, tenant IDs, request paths or feature flags without cardinality limits forcing you to drop them.
* **BubbleUp**: Select an anomalous region of a graph and Honeycomb compares those events against the baseline to show which field values distinguish them.
* **Distributed tracing**: Trace waterfalls are built from the same events you query, so you move from an aggregate graph to an individual request.
* **SLOs**: Service level objectives with burn-rate alerting, so you are paged on user-visible impact rather than on raw thresholds.
* **Refinery**: A tail sampling proxy you run in your own environment, combining rules-based, dynamic, throughput-based and deterministic sampling, with query results adjusted for the sample rate.
* **MCP integration**: A Model Context Protocol server lets AI agents query your observability data.

## Best Practices

* Instrument with the [OpenTelemetry](/specifications/opentelemetry) SDKs and add business context as span attributes: customer or tenant ID, plan, API version, route template, idempotency key. The value of a high-cardinality store comes from the fields you add.
* Record the route template (`/orders/{id}`) as well as the concrete path, so you can group by endpoint and still find a single request.
* Propagate [`traceparent`](/headers/traceparent) across every service, gateway and queue so a request appears as one trace instead of disconnected fragments.
* Sample at the tail with Refinery once volume makes full retention expensive, keeping every error and slow request and sampling the healthy majority. Head sampling alone discards exactly the requests you will later want.
* Define SLOs on what clients experience, such as the share of requests that succeed below a latency target, rather than alerting on CPU or individual error counts.
* Never put credentials, tokens or unmasked personal data in span attributes. Unlimited fields make it easy to attach a whole request body; filter in the SDK or Collector before data leaves your network.
