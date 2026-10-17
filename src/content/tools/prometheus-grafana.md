---
name: "Prometheus & Grafana"
description: "The standard open-source time-series DB and dashboarding stack for API infrastructure metrics."
category: "observability"
lifecycleStages: ["monitoring"]
url: "https://prometheus.io"
pricing: "open-source"
updatedDate: 2026-10-14
---

## What is Prometheus & Grafana?

The pair is the most common self-hosted metrics stack, and the two are separate projects. Prometheus, a CNCF graduated project under the Apache 2.0 license, scrapes metrics over HTTP from a `/metrics` endpoint on each target, stores them as time series identified by a metric name and a set of labels, evaluates alerting rules written in PromQL, and hands firing alerts to the separate Alertmanager for routing, grouping and silencing. Grafana, developed by Grafana Labs under the AGPLv3 license, is the dashboarding layer: it queries Prometheus and many other data sources (Loki for logs, Tempo or [Jaeger](/tools/observability/jaeger) for traces, SQL databases) and has its own alerting. Grafana Labs also sells a hosted version, Grafana Cloud, with a free tier.

## Why use it in the API Lifecycle?

* **Request metrics per route**: Client libraries for most languages expose counters and histograms such as `http_requests_total` and `http_request_duration_seconds`, labeled by method, route and status code.
* **PromQL**: Rates, ratios and percentiles are computed at query time, for example the share of 5xx responses per route or the p99 latency from a histogram with `histogram_quantile`.
* **Alerting rules**: Rules are PromQL expressions with a `for` duration, and Alertmanager deduplicates and routes them to on-call tools.
* **Exporters**: Gateways, proxies, databases and queues publish metrics in the Prometheus format directly or through an exporter, so the API and everything it depends on sit in one system.
* **Grafana dashboards**: Panels combine Prometheus metrics with logs and traces from other data sources, so a latency spike can be followed to the requests behind it.

## Best Practices

* Instrument the RED metrics for every route: request rate, errors and duration. One counter labeled with `method`, `route` and `code`, and one histogram for duration, answer most API questions.
* Label by route template (`/orders/{id}`), never by raw path, user ID, API key or email address. Every distinct label combination is a new time series, and unbounded labels are the usual way a Prometheus server runs out of memory.
* Record latency as a histogram in seconds, not as a summary or a pre-computed average. Histograms can be aggregated across instances and queried for any percentile; averages hide the slow tail your users feel.
* Compute error rate as a ratio, and split 4xx from 5xx: `sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`. Page on the 5xx ratio; a [`429 Too Many Requests`](/status-codes/429) or [`404 Not Found`](/status-codes/404) is usually the API behaving correctly.
* Alert on symptoms users feel (error ratio, latency against an SLO) rather than on causes such as CPU, and give every rule a `for` clause so a single scrape blip does not page anyone.
* Use recording rules for expensive expressions that dashboards and alerts share, so Grafana panels stay fast and every panel and alert computes the same number.
* Do not expose `/metrics` on the public API listener. Serve it on an internal port or behind authentication, because metric names and labels leak routes and internals. See [Health Checks](/guides/health-checks) for the same concern with probe endpoints.
* Keep dashboards in Git as JSON or through Grafana provisioning, so a change to a dashboard is reviewed like any other change and survives a rebuilt Grafana instance.
