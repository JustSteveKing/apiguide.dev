---
name: "Prometheus & Grafana"
description: "The standard open-source time-series DB and dashboarding stack for API infrastructure metrics."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://prometheus.io"
pricing: "open-source"
---

## What is Prometheus & Grafana?

Prometheus is an open-source monitoring system that uses a dimensional data model and a flexible query language. It provides an efficient time series database and supports modern alerting for applications, systems, and services.

## Why use it in the API Lifecycle?

* **Dimensional data model**: Prometheus models time series in a flexible dimensional data model. Time series are identified by a metric name and a set of key-value pairs.
* **Queries with PromQL**: The PromQL query language allows querying, correlating, and transforming time series data for visualizations and alerts.
* **Alerting Management**: Alerting rules are based on PromQL and leverage the dimensional data model. A separate Alertmanager component handles notifications and silencing.
* **Simple Deployment and Operation**: Prometheus servers operate independently and rely on local storage. The statically linked binaries developed in Go are designed for easy deployment across various environments.
* **Instrumentation Libraries**: Prometheus offers official and community-contributed metrics instrumentation libraries that cover most major languages.
* **System Integrations**: Prometheus includes official and community-contributed integrations (exporters) to extract metrics from existing systems.

## Best Practices

* Leverage Prometheus's native integration with cloud-native environments like Kubernetes for continuous service discovery and monitoring.
* Configure a dedicated Alertmanager component to handle alert notifications and implement silencing rules effectively, separate from the core Prometheus server.
* Deploy Prometheus servers independently and rely on local storage for streamlined operation and simplified deployment across diverse environments.
* Utilize official and community-contributed instrumentation libraries to ensure standardized metric collection directly within applications written in various programming languages.
