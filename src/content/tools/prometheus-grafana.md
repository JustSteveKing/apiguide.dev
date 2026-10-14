---
name: "Prometheus & Grafana"
description: "The standard open-source time-series DB and dashboarding stack for API infrastructure metrics."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://prometheus.io"
pricing: "open-source"
---

## What is Prometheus & Grafana?

Prometheus is an open-source monitoring system that includes a dimensional data model, a flexible query language, an efficient time series database, and a modern alerting approach. It is designed for monitoring applications, systems, and services, offering capabilities for instrumenting, collecting, storing, and querying metrics.

## Why use it in the API Lifecycle?

* **Dimensional data model**: Prometheus models time series using a flexible dimensional data model, where time series are identified by a metric name and a set of key-value pairs.
* **Query language (PromQL)**: The PromQL query language enables users to query, correlate, and transform time series data for visualizations, alerts, and other purposes.
* **Alerting**: Alerting rules are based on PromQL and utilize the dimensional data model. A separate Alertmanager component handles notifications and silencing.
* **Instrumentation libraries**: Prometheus provides official and community-contributed metrics instrumentation libraries that support most major languages.
* **Integrations**: Prometheus includes a variety of official and community-contributed integrations to extract metrics from existing systems.

## Best Practices

* Leverage PromQL for complex data analysis and transformations to create custom visualizations and targeted alerts.
* Utilize the Alertmanager component to effectively manage and route notifications, and to configure silencing for alerts.
* Deploy Prometheus servers independently with local storage for straightforward operation and ease of deployment across environments.
* Instrument applications with client libraries to expose custom metrics, enhancing monitoring granularity.
* Integrate with existing systems using available exporters to collect metrics from a wide range of services without manual intervention.
