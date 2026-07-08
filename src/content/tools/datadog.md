---
name: "Datadog APM"
description: "An observability platform providing deep infrastructure monitoring, application performance monitoring (APM), and API log tracking."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://datadoghq.com"
pricing: "paid"
---

## What is Datadog APM?

Datadog is a comprehensive monitoring and security platform. Datadog APM (Application Performance Monitoring) provides end-to-end distributed tracing from web browsers and mobile apps down to database queries.

## Why use it in the API Lifecycle?

* **Distributed Tracing**: Trace a single client request as it travels across gateways, authentication services, internal microservices, and databases.
* **Performance Bottlenecks**: Identify exactly which function call, external API query, or SQL statement is causing slow latencies.
* **Anomaly Detection**: Set up alerts to notify your team when error rates (5xx status codes) spike or latencies exceed defined thresholds (p99).

## Best Practices

* Correlate your API logs with trace IDs so you can view the exact debug logs for a specific failing transaction.
