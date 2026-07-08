---
name: "KrakenD"
description: "An ultra-performant, stateless API gateway built in Go, designed to handle large-scale routing without database dependencies."
category: "gateways-management"
lifecycleStages: ["deployment"]
url: "https://krakend.io"
pricing: "open-source"
---

## What is KrakenD?

KrakenD is an ultra-performant, open-source API gateway built in Go. It focuses on offering a stateless proxy engine that requires no database configurations, reading all routing and aggregation rules from a single JSON/YAML file.

## Why use it in the API Lifecycle?

* **Extreme Performance**: Outperforms most gateways due to its stateless design and Go-native concurrency, requiring minimal CPU/memory.
* **Response Aggregation**: Aggregate responses from multiple backend microservices into a single JSON response payload for clients.
* **Data Transformation**: Filter, rename, and transform payload keys directly in the gateway layer.

## Best Practices

* Version control your `krakend.json` configuration file and deploy the gateway inside stateless Docker containers.
