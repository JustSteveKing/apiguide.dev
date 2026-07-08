---
name: "Prometheus & Grafana"
description: "The standard open-source time-series DB and dashboarding stack for API infrastructure metrics."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://prometheus.io"
pricing: "open-source"
---

## What is Prometheus & Grafana?

Prometheus is an open-source time-series database and alerting system primarily used for metric collection. Grafana is the companion visualization tool used to build charts, graphs, and operations dashboards.

## Why use it in the API Lifecycle?

* **Infrastructure Metrics**: Collect high-level API operational metrics (request rates, HTTP status code distributions, response latencies).
* **OpenTelemetry Native**: Native integration with open telemetry standards, capturing metrics from gateways and backend services.
* **Custom Alerting**: Configure Grafana to alert Slack or PagerDuty when API request volumes drop or latencies exceed limits.

## Best Practices

* Instrument your backend application to export standard RED metrics (Rate, Errors, Duration) for monitoring.
