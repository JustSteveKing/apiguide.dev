---
name: "Jaeger"
description: "A CNCF-graduated, open-source distributed tracing backend whose v2 is built on the OpenTelemetry Collector."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://www.jaegertracing.io"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is Jaeger?

Jaeger is an open-source distributed tracing platform, licensed under Apache 2.0 and a graduated Cloud Native Computing Foundation project since 2019. It stores traces and gives you a UI and query API for following a single request across every service it touched. Jaeger v2 is a new architecture built on the OpenTelemetry Collector framework: the Jaeger binary is a customized Collector distribution, so receivers, processors and exporters are configured the same way as in any Collector. Jaeger v1 is archived. Jaeger is a backend, not an instrumentation library. Its own client libraries were retired in favor of the OpenTelemetry SDKs, and Jaeger receives their data natively over OTLP.

## Why use it in the API Lifecycle?

* **Native OTLP ingestion**: Accepts OTLP over gRPC on port 4317 and over HTTP on port 4318, straight from OpenTelemetry SDKs or a Collector.
* **Trace search and comparison**: Find traces by service, operation, tags and duration, and inspect the span timeline to see where latency and errors came from.
* **Service dependency view**: Derives a map of which services call which from the traces themselves.
* **Pluggable storage**: Memory and Badger for development, and Cassandra, Elasticsearch, OpenSearch and ClickHouse for production, with Kafka available as a buffer in front of storage.
* **Sampling**: Supports remote sampling configuration and adaptive sampling, and inherits the Collector's tail sampling processor.
* **Query API**: The gRPC `api_v3` query service is the recommended way to retrieve traces programmatically, with an HTTP JSON equivalent on the query port.

## Best Practices

* Instrument services with the [OpenTelemetry](/specifications/opentelemetry) SDKs and export OTLP. Do not start new work on the legacy Jaeger clients or the deprecated Thrift and Jaeger Protobuf formats; they exist only for backward compatibility.
* Propagate [`traceparent`](/headers/traceparent) and [`tracestate`](/headers/tracestate) on every outbound call, including through gateways and message brokers. A trace is only as complete as the least-instrumented hop, and a proxy that drops the header splits one request into two traces.
* Run an OpenTelemetry Collector between services and Jaeger rather than exporting directly. It batches, retries and samples in one place, and lets you change backends without redeploying services.
* Use the Memory or Badger backends for local development only. Choose a production store your team already operates, and set a retention period: tracing data grows with traffic.
* Decide head versus tail sampling deliberately. Head sampling is cheap but discards the rare slow or failing request before you know it matters; tail sampling keeps errors and outliers at the cost of buffering whole traces.
* Return the trace ID to clients in error responses, for example as an extension member in a [Problem Details](/specifications/problem-details) body, so a support ticket leads straight to the trace. Do not put anything sensitive in span attributes; traces are read by more people than logs.
